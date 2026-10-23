import { z } from "zod";
import { proxyJson, badRequest, unauthorised } from "@/lib/route-helpers";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  paymentId: z.string().min(4).max(128),
  orderId: z.string().min(4).max(128),
  signature: z.string().min(16).max(256),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorised("Sign in before verifying a payment.");

  const payload = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Payment id, order id and signature are required.");
  }

  return proxyJson("/payments/verify", { json: parsed.data });
}
