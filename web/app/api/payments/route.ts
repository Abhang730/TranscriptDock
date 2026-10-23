import { proxyJson, unauthorised } from "@/lib/route-helpers";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorised("Sign in to see your payment history.");
  return proxyJson("/payments");
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorised("Sign in before buying the support pack.");

  // The amount, currency and credit grant are decided by the backend only.
  return proxyJson("/payments/orders", { method: "POST", json: {} });
}
