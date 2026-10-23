import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  let backend: { ok: boolean; detail?: unknown } = { ok: false };

  try {
    const { response, body } = await callBackend("/health", {
      authenticate: false,
      signal: AbortSignal.timeout(2_500),
    });
    backend = response.ok
      ? { ok: true, detail: body }
      : { ok: false, detail: { status: response.status } };
  } catch {
    backend = { ok: false, detail: { error: "unreachable" } };
  }

  return NextResponse.json(
    {
      ok: backend.ok,
      service: "transcriptdock-web",
      backend,
      checkedAt: new Date().toISOString(),
    },
    { status: backend.ok ? 200 : 503 },
  );
}
