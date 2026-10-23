import { z } from "zod";
import { proxyJson, badRequest } from "@/lib/route-helpers";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const createJobSchema = z.object({
  mode: z.enum(["single", "playlist"]),
  url: z.string().trim().min(1).max(2048),
  language: z.enum(["auto", "en", "hi", "mr"]).default("auto"),
  selectedVideoIds: z.array(z.string().min(1).max(64)).max(200).optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createJobSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest(
      "Expected a supported mode, a URL and a language.",
      "invalid_request",
    );
  }

  const user = await getSessionUser();
  const headers: Record<string, string> = {};
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["X-Forwarded-For"] = forwarded;

  return proxyJson("/jobs", {
    json: parsed.data,
    headers,
    // Anonymous users may run a single demo video; the backend enforces that.
    authenticate: Boolean(user),
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json(
      { error: "Sign in to see your processing history.", code: "unauthenticated" },
      { status: 401 },
    );
  }

  return proxyJson("/jobs");
}
