import { z } from "zod";
import { proxyJson, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return badRequest("That job id is not valid.", "invalid_id");
  }

  return proxyJson(`/jobs/${id}/retry`, { method: "POST" });
}
