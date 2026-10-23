from __future__ import annotations

GOOD_VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def _create_single(client, headers=None) -> dict:
    response = client.post(
        "/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO}, headers=headers or {}
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_item_txt_export(client, auth_headers):
    job = _create_single(client, auth_headers)
    item = job["items"][0]

    response = client.get(
        f"/v1/jobs/{job['id']}/items/{item['id']}/export?format=txt",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert "demonstration data" in response.text


def test_item_srt_and_vtt_export(client, auth_headers):
    job = _create_single(client, auth_headers)
    item = job["items"][0]

    srt = client.get(
        f"/v1/jobs/{job['id']}/items/{item['id']}/export?format=srt",
        headers=auth_headers,
    )
    assert srt.status_code == 200
    assert "-->" in srt.text

    vtt = client.get(
        f"/v1/jobs/{job['id']}/items/{item['id']}/export?format=vtt",
        headers=auth_headers,
    )
    assert vtt.status_code == 200
    assert vtt.text.startswith("WEBVTT")


def test_item_csv_export(client, auth_headers):
    job = _create_single(client, auth_headers)
    item = job["items"][0]

    response = client.get(
        f"/v1/jobs/{job['id']}/items/{item['id']}/export?format=csv",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "start_seconds,duration_seconds,text" in response.text


def test_combined_and_zip_exports(client, auth_headers):
    job = _create_single(client, auth_headers)

    combined = client.get(f"/v1/jobs/{job['id']}/export?format=txt", headers=auth_headers)
    assert combined.status_code == 200
    assert "Provider: demo" in combined.text

    archive = client.get(f"/v1/jobs/{job['id']}/export?format=zip", headers=auth_headers)
    assert archive.status_code == 200
    assert archive.headers["content-type"] == "application/zip"
    assert archive.content[:2] == b"PK"

    report = client.get(f"/v1/jobs/{job['id']}/export?format=csv", headers=auth_headers)
    assert report.status_code == 200
    assert report.text.splitlines()[0].startswith("position,title,video_id")


def test_unsupported_export_format_is_rejected(client, auth_headers):
    job = _create_single(client, auth_headers)
    response = client.get(f"/v1/jobs/{job['id']}/export?format=pdf", headers=auth_headers)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "export_unavailable"


def test_unknown_item_in_job_returns_404(client, auth_headers):
    job = _create_single(client, auth_headers)
    response = client.get(
        f"/v1/jobs/{job['id']}/items/00000000-0000-4000-8000-000000000000/export?format=txt",
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_anonymous_job_can_be_exported_by_capability(client):
    job = _create_single(client)
    item = job["items"][0]

    response = client.get(f"/v1/jobs/{job['id']}/items/{item['id']}/export?format=txt")
    assert response.status_code == 200
    assert response.text
