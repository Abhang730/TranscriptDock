import { proxyJson, unauthorised } from "@/lib/route-helpers";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return unauthorised("Sign in to see your credit balance.");
  }

  return proxyJson("/credits");
}
