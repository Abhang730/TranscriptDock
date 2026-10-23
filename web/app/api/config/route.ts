import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { FREE_TIER, SUPPORT_PACK, TRANSCRIPT_LANGUAGES } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * Public feature configuration. Reads the backend so limits have one source of
 * truth, and falls back to conservative defaults when it is unavailable.
 */
export async function GET() {
  try {
    const { response, body } = await callBackend("/config", {
      authenticate: false,
      signal: AbortSignal.timeout(3_000),
    });
    if (response.ok && body) {
      return NextResponse.json(body);
    }
  } catch {
    // Fall through to the static defaults: the marketing site must still work.
  }

  return NextResponse.json({
    demoMode: true,
    provider: "demo",
    paymentsEnabled: false,
    supportedLanguages: TRANSCRIPT_LANGUAGES.map((item) => item.value),
    freeBatchSize: FREE_TIER.maxVideosPerBatch,
    paidBatchSize: SUPPORT_PACK.maxVideosPerBatch,
    packPricePaise: SUPPORT_PACK.pricePaise,
    packCredits: SUPPORT_PACK.credits,
    freeCredits: FREE_TIER.credits,
    anonymousSingleAllowed: true,
  });
}
