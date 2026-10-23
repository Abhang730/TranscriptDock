import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

export const metadata: Metadata = { title: "Sign in" };

interface PageProps {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const user = await getSessionUser();
  if (user) redirect(nextPath);

  const error =
    params.error === "auth_callback_failed"
      ? "The sign-in link could not be verified. Request a new link and try again."
      : typeof params.error === "string"
        ? params.error.slice(0, 200)
        : null;

  return (
    <AuthShell>
      <AuthForm
        mode="sign-in"
        nextPath={nextPath}
        initialError={error}
        notConfigured={params.reason === "not-configured"}
      />
    </AuthShell>
  );
}
