import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, SUPABASE_URL } from "./config";

/**
 * Server-only Supabase admin client using the service-role key.
 * Never import this module from a client component.
 */
export function createAdminClient() {
  const serviceKey = getServiceRoleKey();
  if (!SUPABASE_URL || !serviceKey) return null;

  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
