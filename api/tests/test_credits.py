from __future__ import annotations

import asyncio

from app.database.memory_store import MemoryStore

GOOD_VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def test_credits_require_authentication(client):
    response = client.get("/v1/credits")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthenticated"


def test_free_credits_are_granted_once(client, auth_headers):
    first = client.get("/v1/credits", headers=auth_headers).json()
    second = client.get("/v1/credits", headers=auth_headers).json()

    assert first["balance"] == 5
    assert first["freeCreditsGranted"] == 5
    assert first["packHeld"] is False
    assert second["balance"] == 5


def test_insufficient_credits_block_single_job(app_factory):
    from .conftest import make_token

    client = app_factory(free_credits=0)
    headers = {"Authorization": f"Bearer {make_token()}"}

    response = client.post(
        "/v1/jobs", json={"mode": "single", "url": GOOD_VIDEO}, headers=headers
    )
    assert response.status_code == 402
    assert response.json()["detail"]["code"] == "insufficient_credits"

    credits = client.get("/v1/credits", headers=headers).json()
    assert credits["balance"] == 0


def test_balance_never_goes_negative():
    async def scenario():
        store = MemoryStore()
        await store.ensure_account("user", None, 1)
        first = await store.consume_credit("user", "item:1")
        second = await store.consume_credit("user", "item:2")
        third = await store.consume_credit("user", "item:3")
        return first, second, third, await store.get_balance("user")

    first, second, third, balance = asyncio.run(scenario())
    assert (first, second, third) == (True, False, False)
    assert balance == 0


def test_consumption_is_idempotent_per_reference():
    async def scenario():
        store = MemoryStore()
        await store.ensure_account("user", None, 2)
        await store.consume_credit("user", "item:same")
        await store.consume_credit("user", "item:same")
        return await store.get_balance("user")

    assert asyncio.run(scenario()) == 1


def test_grant_is_idempotent_per_reference():
    async def scenario():
        store = MemoryStore()
        await store.ensure_account("user", None, 2)
        first = await store.grant_credits("user", 10, "support_pack", "payment:abc", mark_pack=True)
        second = await store.grant_credits("user", 10, "support_pack", "payment:abc", mark_pack=True)
        account = await store.get_account("user")
        return first, second, account.balance, account.pack_purchased_at is not None

    first, second, balance, pack = asyncio.run(scenario())
    assert first == second == 12
    assert balance == 12
    assert pack is True
