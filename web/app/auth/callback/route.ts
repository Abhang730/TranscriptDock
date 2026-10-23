import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

/**
 * Handles Supabase OAuth / email-link callbacks.
 * Exchanges the one-time code for a cookie-backed session, then redirects to a
 * validated same-site path.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(errorDescription.slice(0, 200))}`, url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?error=auth_callback_failed", url.origin),
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/sign-in?reason=not-configured", url.origin),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("The sign-in link expired or was already used.")}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
