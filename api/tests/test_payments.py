from __future__ import annotations

import hashlib
import hmac
import json
import uuid

import pytest

from app.services.payment_service import PaymentService


@pytest.fixture
def fake_razorpay(monkeypatch):
    async def fake_create(self, *, amount, receipt, user_id):
        return {
            "id": f"order_{uuid.uuid4().hex[:14]}",
            "amount": amount,
            "currency": "INR",
        }

    monkeypatch.setattr(PaymentService, "_create_remote_order", fake_create)


def _create_order(client, headers) -> dict:
    response = client.post("/v1/payments/orders", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _signature(secret: str, message: str) -> str:
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def _webhook(client, body: dict, signature: str, event_id: str = "evt_test_1"):
    raw = json.dumps(body).encode()
    return client.post(
        "/v1/webhooks/razorpay",
        content=raw,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "X-Razorpay-Event-Id": event_id,
        },
    )


def test_checkout_requires_authentication(client):
    assert client.post("/v1/payments/orders").status_code == 401


def test_checkout_disabled_without_credentials(app_factory):
    client = app_factory(razorpay_key_id=None, razorpay_key_secret=None)
    from .conftest import make_token

    headers = {"Authorization": f"Bearer {make_token()}"}
    response = client.post("/v1/payments/orders", headers=headers)
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "payments_not_configured"


def test_order_amount_and_currency_are_server_side(client, auth_headers, fake_razorpay):
    response = client.post(
        "/v1/payments/orders",
        headers=auth_headers,
        json={"amount": 1, "currency": "USD", "credits": 9999},
    )
    assert response.status_code == 200
    order = response.json()

    assert order["amountPaise"] == 4900
    assert order["currency"] == "INR"
    assert order["credits"] == 10
    assert order["packPriceInr"] == 49
    assert order["keyId"] == "rzp_test_key_id"


def test_verified_payment_grants_credits_once(client, auth_headers, fake_razorpay):
    order = _create_order(client, auth_headers)
    payment_id = "pay_test_123"
    signature = _signature(
        "test_key_secret", f"{order['orderId']}|{payment_id}"
    )

    first = client.post(
        "/v1/payments/verify",
        headers=auth_headers,
        json={
            "paymentId": payment_id,
            "orderId": order["orderId"],
            "signature": signature,
        },
    )
    assert first.status_code == 200, first.text
    assert first.json() == {"ok": True, "creditsGranted": 10, "balance": 15}

    second = client.post(
        "/v1/payments/verify",
        headers=auth_headers,
        json={
            "paymentId": payment_id,
            "orderId": order["orderId"],
            "signature": signature,
        },
    )
    assert second.status_code == 200
    assert second.json()["creditsGranted"] == 0
    assert second.json()["balance"] == 15

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 15
    assert credits["packHeld"] is True

    history = client.get("/v1/payments", headers=auth_headers).json()
    assert len(history["payments"]) == 1
    assert history["payments"][0]["status"] == "paid"
    assert history["payments"][0]["creditsGranted"] == 10


def test_invalid_signature_grants_nothing(client, auth_headers, fake_razorpay):
    order = _create_order(client, auth_headers)

    response = client.post(
        "/v1/payments/verify",
        headers=auth_headers,
        json={
            "paymentId": "pay_test_123",
            "orderId": order["orderId"],
            "signature": "0" * 64,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "payment_verification_failed"

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 5
    assert credits["packHeld"] is False


def test_payment_cannot_be_verified_by_another_user(
    client, auth_headers, other_headers, fake_razorpay
):
    order = _create_order(client, auth_headers)
    payment_id = "pay_test_999"
    signature = _signature("test_key_secret", f"{order['orderId']}|{payment_id}")

    response = client.post(
        "/v1/payments/verify",
        headers=other_headers,
        json={
            "paymentId": payment_id,
            "orderId": order["orderId"],
            "signature": signature,
        },
    )
    assert response.status_code == 404


def test_unknown_order_cannot_be_verified(client, auth_headers, fake_razorpay):
    response = client.post(
        "/v1/payments/verify",
        headers=auth_headers,
        json={
            "paymentId": "pay_test_123",
            "orderId": "order_does_not_exist",
            "signature": "a" * 64,
        },
    )
    assert response.status_code == 404


def test_webhook_grants_credits_with_valid_signature(
    client, auth_headers, fake_razorpay
):
    order = _create_order(client, auth_headers)
    body = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_1",
                    "order_id": order["orderId"],
                    "amount": 4900,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    raw = json.dumps(body).encode()
    signature = _signature("test_webhook_secret", raw.decode())

    response = _webhook(client, body, signature, event_id="evt_captured_1")
    assert response.status_code == 200, response.text
    assert response.json()["ok"] is True

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 15


def test_duplicate_webhook_is_idempotent(client, auth_headers, fake_razorpay):
    order = _create_order(client, auth_headers)
    body = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_2",
                    "order_id": order["orderId"],
                    "amount": 4900,
                    "currency": "INR",
                }
            }
        },
    }
    raw = json.dumps(body).encode()
    signature = _signature("test_webhook_secret", raw.decode())

    first = _webhook(client, body, signature, event_id="evt_dupe_1")
    second = _webhook(client, body, signature, event_id="evt_dupe_1")

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json().get("duplicate") is True

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 15


def test_webhook_rejects_invalid_signature(client, auth_headers, fake_razorpay):
    order = _create_order(client, auth_headers)
    body = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_3",
                    "order_id": order["orderId"],
                    "amount": 4900,
                    "currency": "INR",
                }
            }
        },
    }
    response = _webhook(client, body, "f" * 64, event_id="evt_bad_sig")

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "payment_verification_failed"

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 5


def test_webhook_rejects_amount_mismatch(client, auth_headers, fake_razorpay):
    order = _create_order(client, auth_headers)
    body = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_4",
                    "order_id": order["orderId"],
                    "amount": 100,
                    "currency": "INR",
                }
            }
        },
    }
    raw = json.dumps(body).encode()
    signature = _signature("test_webhook_secret", raw.decode())

    response = _webhook(client, body, signature, event_id="evt_amount_mismatch")
    assert response.status_code == 400

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 5


def test_failed_payment_webhook_marks_payment_failed(
    client, auth_headers, fake_razorpay
):
    order = _create_order(client, auth_headers)
    body = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_5",
                    "order_id": order["orderId"],
                    "amount": 4900,
                    "currency": "INR",
                }
            }
        },
    }
    raw = json.dumps(body).encode()
    signature = _signature("test_webhook_secret", raw.decode())

    response = _webhook(client, body, signature, event_id="evt_failed_1")
    assert response.status_code == 200

    history = client.get("/v1/payments", headers=auth_headers).json()
    assert history["payments"][0]["status"] == "failed"
    assert history["payments"][0]["creditsGranted"] == 0

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 5


def test_unhandled_webhook_event_is_acknowledged(client, auth_headers, fake_razorpay):
    _create_order(client, auth_headers)
    body = {"event": "payment.authorized", "payload": {}}
    raw = json.dumps(body).encode()
    signature = _signature("test_webhook_secret", raw.decode())

    response = _webhook(client, body, signature, event_id="evt_other_1")
    assert response.status_code == 200
    assert response.json().get("ignored") is True
