import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

export const metadata: Metadata = { title: "Create account" };

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const user = await getSessionUser();
  if (user) redirect(nextPath);

  return (
    <AuthShell>
      <AuthForm mode="sign-up" nextPath={nextPath} />
    </AuthShell>
  );
}
