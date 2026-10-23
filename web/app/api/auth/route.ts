import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    configured: isSupabaseConfigured(),
    authenticated: Boolean(user),
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
  });
}
