import { z } from "zod";
import { proxyDownload, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const formatSchema = z.enum(["txt", "zip", "csv", "srt", "vtt"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return badRequest("That job id is not valid.", "invalid_id");
  }

  const format = new URL(request.url).searchParams.get("format") ?? "txt";
  if (!formatSchema.safeParse(format).success) {
    return badRequest("Unsupported export format.", "invalid_format");
  }

  return proxyDownload(`/jobs/${id}/export?format=${format}`);
}
