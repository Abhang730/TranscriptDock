import { NextResponse } from "next/server";
import { callBackend, normaliseBackendError } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to delete your account.", code: "unauthenticated" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Account deletion needs SUPABASE_SERVICE_ROLE_KEY on the server. Ask the operator to configure it.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  // 1. Delete the user's application data (enforced server-side in FastAPI).
  try {
    const { response, body } = await callBackend("/me", { method: "DELETE" });
    if (!response.ok) {
      const normalised = normaliseBackendError(response.status, body);
      return NextResponse.json(
        { error: normalised.error, code: normalised.code },
        { status: normalised.status },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "The data service is unreachable, so your account was not deleted. Nothing was removed.",
        code: "service_unavailable",
      },
      { status: 503 },
    );
  }

  // 2. Delete the auth user. If this fails, the account still exists but has no
  // job or transcript data, and the request can be retried safely.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      {
        error:
          "Your transcript data was deleted, but the sign-in account could not be removed. Contact support or retry.",
        code: "auth_delete_failed",
      },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
