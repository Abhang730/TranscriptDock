from __future__ import annotations

from .conftest import wait_for_job

PLAYLIST_URL = "https://www.youtube.com/playlist?list=PL1234567890abcdef"


def _preview(client):
    response = client.post("/v1/playlists/preview", json={"url": PLAYLIST_URL})
    assert response.status_code == 200, response.text
    return response.json()


def test_playlist_preview_keeps_playlist_order_and_includes_a_failure(client):
    preview = _preview(client)

    assert preview["isDemo"] is True
    assert preview["provider"] == "demo"
    assert len(preview["entries"]) >= 6

    positions = [entry["videoId"] for entry in preview["entries"]]
    assert positions[2].startswith("fail")
    assert len(set(positions)) == len(positions)


def test_playlist_preview_rejects_invalid_playlist(client):
    response = client.post(
        "/v1/playlists/preview",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
    )
    assert response.status_code == 400


def test_playlist_requires_authentication(client):
    response = client.post(
        "/v1/jobs", json={"mode": "playlist", "url": PLAYLIST_URL}
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthenticated"


def test_playlist_processes_selected_items_with_partial_failure(
    client, auth_headers
):
    preview = _preview(client)
    selected = [entry["videoId"] for entry in preview["entries"][:3]]
    assert selected[2].startswith("fail")

    created = client.post(
        "/v1/jobs",
        json={
            "mode": "playlist",
            "url": PLAYLIST_URL,
            "language": "auto",
            "selectedVideoIds": selected,
        },
        headers=auth_headers,
    )
    assert created.status_code == 201, created.text
    job = created.json()
    assert job["mode"] == "playlist"
    assert job["totalItems"] == 3

    finished = wait_for_job(client, job["id"], auth_headers)

    assert finished["status"] == "partial"
    assert finished["succeededItems"] == 2
    assert finished["failedItems"] == 1

    statuses = [item["status"] for item in finished["items"]]
    assert statuses == ["success", "success", "failed"]

    failed = finished["items"][2]
    assert "caption" in failed["errorMessage"].lower()

    # Credits are charged only for successful items.
    credits = client.get("/v1/credits", headers=auth_headers).json()
    assert credits["balance"] == 3  # 5 free credits - 2 successful items


def test_retry_failed_items_is_idempotent(client, auth_headers):
    preview = _preview(client)
    selected = [entry["videoId"] for entry in preview["entries"][:3]]

    job = client.post(
        "/v1/jobs",
        json={"mode": "playlist", "url": PLAYLIST_URL, "selectedVideoIds": selected},
        headers=auth_headers,
    ).json()
    finished = wait_for_job(client, job["id"], auth_headers)
    balance_before = client.get("/v1/credits", headers=auth_headers).json()["balance"]

    retried = client.post(f"/v1/jobs/{job['id']}/retry", headers=auth_headers)
    assert retried.status_code == 202, retried.text
    assert retried.json()["items"][2]["retryCount"] == 1

    after = wait_for_job(client, job["id"], auth_headers)
    assert after["status"] == "partial"
    assert after["succeededItems"] == 2
    assert after["failedItems"] == 1

    balance_after = client.get("/v1/credits", headers=auth_headers).json()["balance"]
    assert balance_after == balance_before


def test_batch_limit_is_enforced(client, auth_headers):
    preview = _preview(client)
    selected = [entry["videoId"] for entry in preview["entries"][:4]]

    response = client.post(
        "/v1/jobs",
        json={"mode": "playlist", "url": PLAYLIST_URL, "selectedVideoIds": selected},
        headers=auth_headers,
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "batch_limit"
    assert "3" in detail["error"]


def test_insufficient_credits_blocks_batch(app_factory):
    client = app_factory(free_credits=2)
    from .conftest import make_token

    headers = {"Authorization": f"Bearer {make_token()}"}
    preview = _preview(client)
    selected = [entry["videoId"] for entry in preview["entries"][:3]]

    response = client.post(
        "/v1/jobs",
        json={"mode": "playlist", "url": PLAYLIST_URL, "selectedVideoIds": selected},
        headers=headers,
    )
    assert response.status_code == 402
    assert response.json()["detail"]["code"] == "insufficient_credits"


def test_empty_selection_is_rejected(client, auth_headers):
    response = client.post(
        "/v1/jobs",
        json={
            "mode": "playlist",
            "url": PLAYLIST_URL,
            "selectedVideoIds": ["doesnotexist"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "playlist_empty"


def test_playlist_job_is_isolated_between_users(
    client, auth_headers, other_headers
):
    preview = _preview(client)
    selected = [entry["videoId"] for entry in preview["entries"][:2]]
    job = client.post(
        "/v1/jobs",
        json={"mode": "playlist", "url": PLAYLIST_URL, "selectedVideoIds": selected},
        headers=auth_headers,
    ).json()
    wait_for_job(client, job["id"], auth_headers)

    response = client.get(f"/v1/jobs/{job['id']}", headers=other_headers)
    assert response.status_code == 404

    retry = client.post(f"/v1/jobs/{job['id']}/retry", headers=other_headers)
    assert retry.status_code == 404
