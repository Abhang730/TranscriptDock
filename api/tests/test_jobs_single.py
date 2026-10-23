from __future__ import annotations

GOOD_VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
FAILING_VIDEO = "https://www.youtube.com/watch?v=failAAAAAAA"


def test_anonymous_single_job_returns_demo_transcript(client):
    response = client.post(
        "/v1/jobs",
        json={"mode": "single", "url": GOOD_VIDEO, "language": "auto"},
    )
    assert response.status_code == 201, response.text
    job = response.json()

    assert job["mode"] == "single"
    assert job["status"] == "completed"
    assert job["isDemo"] is True
    assert job["succeededItems"] == 1
    assert job["failedItems"] == 0
    assert len(job["items"]) == 1

    item = job["items"][0]
    transcript = item["transcript"]
    assert transcript["provider"] == "demo"
    assert transcript["isDemo"] is True
    assert transcript["segmentCount"] > 0
    assert transcript["isTimestamped"] is True
    assert "demo" in transcript["title"].lower()
    assert transcript["language"] == "en"
    assert item["errorMessage"] is None


def test_anonymous_job_can_be_polled_by_id(client):
    created = client.post(
        "/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO}
    ).json()

    response = client.get(f"/v1/jobs/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_unknown_job_returns_404(client):
    response = client.get("/v1/jobs/00000000-0000-4000-8000-000000000000")
    assert response.status_code == 404


def test_captions_unavailable_is_a_real_failure(client):
    response = client.post(
        "/v1/jobs", json={"mode": "single", "url": FAILING_VIDEO}
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "captions_unavailable"
    assert "caption" in detail["error"].lower()


def test_invalid_url_is_rejected(client):
    response = client.post(
        "/v1/jobs", json={"mode": "single", "url": "https://example.com/nope"}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "unsupported_host"


def test_mode_mismatch_is_rejected(client):
    response = client.post(
        "/v1/jobs",
        json={
            "mode": "single",
            "url": "https://www.youtube.com/playlist?list=PL1234567890abcdef",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_url"


def test_unsupported_language_is_rejected_by_schema(client):
    response = client.post(
        "/v1/jobs",
        json={"mode": "single", "url": GOOD_VIDEO, "language": "de"},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "validation_error"


def test_authenticated_single_job_is_saved_and_charges_one_credit(
    client, auth_headers
):
    before = client.get("/v1/credits", headers=auth_headers).json()["balance"]

    created = client.post(
        "/v1/jobs",
        json={"mode": "single", "url": GOOD_VIDEO},
        headers=auth_headers,
    )
    assert created.status_code == 201
    job = created.json()

    after = client.get("/v1/credits", headers=auth_headers).json()["balance"]
    assert after == before - 1

    listing = client.get("/v1/jobs", headers=auth_headers)
    assert listing.status_code == 200
    assert any(entry["id"] == job["id"] for entry in listing.json()["jobs"])


def test_jobs_are_isolated_between_users(client, auth_headers, other_headers):
    job = client.post(
        "/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO}, headers=auth_headers
    ).json()

    forbidden = client.get(f"/v1/jobs/{job['id']}", headers=other_headers)
    assert forbidden.status_code == 404

    export = client.get(
        f"/v1/jobs/{job['id']}/export?format=txt", headers=other_headers
    )
    assert export.status_code == 404

    other_listing = client.get("/v1/jobs", headers=other_headers).json()
    assert other_listing["jobs"] == []


def test_anonymous_rate_limit_is_enforced(app_factory):
    client = app_factory(anonymous_single_per_hour=1)

    first = client.post("/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO})
    assert first.status_code == 201

    second = client.post("/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO})
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "rate_limited"
