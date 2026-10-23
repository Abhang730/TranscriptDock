from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.errors import ConfigurationError
from app.main import create_app

from .conftest import make_settings


def test_health_reports_provider_and_store(client):
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider"] == "demo"
    assert body["demoMode"] is True
    assert body["storeBackend"] == "memory"
    assert body["authConfigured"] is True


def test_public_config_exposes_limits(client):
    response = client.get("/v1/config")
    assert response.status_code == 200
    body = response.json()
    assert body["freeBatchSize"] == 3
    assert body["paidBatchSize"] == 5
    assert body["packPricePaise"] == 4900
    assert body["packCredits"] == 10
    assert body["supportedLanguages"] == ["auto", "en", "hi", "mr"]
    assert body["anonymousSingleAllowed"] is True


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["health"] == "/v1/health"


def test_production_refuses_in_memory_store():
    app = create_app(make_settings(app_env="production", store_backend="memory"))
    with pytest.raises(ConfigurationError, match="STORE_BACKEND=memory"):
        with TestClient(app):
            pass


def test_unknown_store_backend_fails_closed():
    app = create_app(make_settings(app_env="production", store_backend="postgres"))
    with pytest.raises(ConfigurationError, match="Unknown STORE_BACKEND"):
        with TestClient(app):
            pass


def test_development_memory_store_still_allowed():
    with TestClient(create_app(make_settings(app_env="development"))) as client:
        assert client.get("/v1/health").json()["storeBackend"] == "memory"
