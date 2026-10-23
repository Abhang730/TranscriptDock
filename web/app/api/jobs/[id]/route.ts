import { z } from "zod";
import { proxyJson, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return badRequest("That job id is not valid.", "invalid_id");
  }

  const headers: Record<string, string> = {};
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["X-Forwarded-For"] = forwarded;

  return proxyJson(`/jobs/${id}`, { headers });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return badRequest("That job id is not valid.", "invalid_id");
  }

  return proxyJson(`/jobs/${id}`, { method: "DELETE" });
}
