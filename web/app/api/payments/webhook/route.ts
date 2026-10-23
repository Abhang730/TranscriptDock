import { proxyJson, badRequest } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook receiver.
 * The body is forwarded byte-for-byte because the signature is computed over
 * the raw payload; parsing and re-serialising would invalidate it.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return badRequest("Missing Razorpay signature header.", "missing_signature");
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return badRequest("Empty webhook body.", "empty_body");
  }

  return proxyJson("/webhooks/razorpay", {
    method: "POST",
    rawBody,
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": signature,
    },
    authenticate: false,
  });
}
