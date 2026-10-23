from __future__ import annotations

GOOD_VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def test_account_deletion_requires_authentication(client):
    response = client.delete("/v1/me")
    assert response.status_code == 401


def test_account_deletion_removes_jobs_and_credits(client, auth_headers):
    job = client.post(
        "/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO}, headers=auth_headers
    ).json()

    assert client.get(f"/v1/jobs/{job['id']}", headers=auth_headers).status_code == 200

    deleted = client.delete("/v1/me", headers=auth_headers)
    assert deleted.status_code == 204

    listing = client.get("/v1/jobs", headers=auth_headers)
    assert listing.status_code == 200
    assert listing.json()["jobs"] == []

    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 0
    # The free grant marker survives so data deletion cannot be repeated to farm
    # free credits.
    assert credits["freeCreditsGranted"] == 5
