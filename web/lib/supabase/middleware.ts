import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export interface SessionResult {
  /** Response that must be forwarded; it carries refreshed auth cookies. */
  response: NextResponse;
  /** Authenticated user id, or null when signed out / not configured. */
  userId: string | null;
  configured: boolean;
}

/**
 * Refreshes the Supabase session cookies on every request.
 * Runs in the edge middleware, so it must not use `next/headers`.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return { response, userId: null, configured: false };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching the user refreshes an expired session before rendering.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null, configured: true };
}
