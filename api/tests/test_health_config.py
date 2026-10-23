from __future__ import annotations


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
