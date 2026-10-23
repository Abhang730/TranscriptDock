import { z } from "zod";
import { proxyDownload, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const formatSchema = z.enum(["txt", "srt", "vtt", "csv"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(itemId).success) {
    return badRequest("That transcript id is not valid.", "invalid_id");
  }

  const format = new URL(request.url).searchParams.get("format") ?? "txt";
  if (!formatSchema.safeParse(format).success) {
    return badRequest("Unsupported export format.", "invalid_format");
  }

  return proxyDownload(
    `/jobs/${id}/items/${itemId}/export?format=${format}`,
  );
}
