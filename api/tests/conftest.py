from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

TEST_SECRET = "test-supabase-jwt-secret-with-at-least-32-bytes"
USER_A = "11111111-1111-4111-8111-111111111111"
USER_B = "22222222-2222-4222-8222-222222222222"


def make_settings(**overrides) -> Settings:
    defaults = dict(
        app_env="test",
        demo_mode=True,
        provider_name="demo",
        store_backend="memory",
        supabase_jwt_secret=TEST_SECRET,
        supabase_url=None,
        razorpay_key_id="rzp_test_key_id",
        razorpay_key_secret="test_key_secret",
        razorpay_webhook_secret="test_webhook_secret",
        free_credits=5,
        free_batch_size=3,
        paid_batch_size=5,
        pack_credits=10,
        pack_price_paise=4900,
        item_timeout_seconds=3.0,
        job_concurrency=3,
        anonymous_single_per_hour=100,
    )
    defaults.update(overrides)
    return Settings(**defaults)


def make_token(
    user_id: str = USER_A,
    email: str = "user-a@example.test",
    *,
    secret: str = TEST_SECRET,
    expires_in: int = 3600,
    audience: str = "authenticated",
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "aud": audience,
        "role": "authenticated",
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def app():
    return create_app(make_settings())


@pytest.fixture
def client(app):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token()}"}


@pytest.fixture
def other_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(USER_B, 'user-b@example.test')}"}


@pytest.fixture
def app_factory():
    clients: list[TestClient] = []

    def build(**overrides):
        application = create_app(make_settings(**overrides))
        test_client = TestClient(application)
        test_client.__enter__()
        clients.append(test_client)
        return test_client

    yield build
    for test_client in reversed(clients):
        test_client.__exit__(None, None, None)


def wait_for_job(
    client: TestClient,
    job_id: str,
    headers: dict[str, str] | None = None,
    timeout: float = 10.0,
) -> dict:
    deadline = time.monotonic() + timeout
    terminal = {"completed", "partial", "failed", "cancelled"}
    last: dict = {}
    while time.monotonic() < deadline:
        response = client.get(f"/v1/jobs/{job_id}", headers=headers or {})
        assert response.status_code == 200, response.text
        last = response.json()
        if last["status"] in terminal:
            return last
        time.sleep(0.05)
    raise AssertionError(f"Job did not finish in time: {last}")
