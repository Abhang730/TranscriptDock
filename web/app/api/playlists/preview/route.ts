import { z } from "zod";
import { proxyJson, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const previewSchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Paste a playlist URL to preview it.", "invalid_request");
  }

  const headers: Record<string, string> = {};
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["X-Forwarded-For"] = forwarded;

  return proxyJson("/playlists/preview", {
    json: parsed.data,
    authenticate: false,
    headers,
  });
}
