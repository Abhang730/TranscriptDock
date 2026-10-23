from __future__ import annotations

from .conftest import TEST_SECRET, USER_A, make_token


def test_protected_endpoint_rejects_missing_token(client):
    response = client.get("/v1/jobs")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthenticated"


def test_protected_endpoint_rejects_garbage_token(client):
    response = client.get(
        "/v1/jobs", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_expired_token_is_rejected(client):
    token = make_token(expires_in=-60)
    response = client.get("/v1/jobs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"]["error"].lower()


def test_token_for_another_secret_is_rejected(client):
    token = make_token(secret="a-different-secret-that-is-long-enough")
    response = client.get("/v1/jobs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_wrong_audience_is_rejected(client):
    token = make_token(audience="anon")
    response = client.get("/v1/jobs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_valid_token_is_accepted(client):
    token = make_token(USER_A)
    response = client.get("/v1/credits", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["balance"] == 5
    assert TEST_SECRET  # guard against accidental import removal
