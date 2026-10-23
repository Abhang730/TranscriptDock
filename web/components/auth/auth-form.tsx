"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

interface AuthFormProps {
  mode: AuthMode;
  nextPath: string;
  initialError?: string | null;
  notConfigured?: boolean;
}

const COPY: Record<AuthMode, { title: string; cta: string; description: string }> = {
  "sign-in": {
    title: "Sign in",
    cta: "Sign in",
    description: "Access your processing history, credits and downloads.",
  },
  "sign-up": {
    title: "Create your account",
    cta: "Create account",
    description:
      "Free accounts include 20 credits and a 5-video playlist batch limit.",
  },
  "forgot-password": {
    title: "Reset your password",
    cta: "Send reset link",
    description:
      "We email you a secure link. It expires, and it can only be used once.",
  },
  "reset-password": {
    title: "Choose a new password",
    cta: "Update password",
    description: "Pick a password you have not used elsewhere.",
  },
};

export function AuthForm({
  mode,
  nextPath,
  initialError,
  notConfigured = false,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(initialError ?? null);
  const [message, setMessage] = React.useState<string | null>(null);

  const configured = isSupabaseConfigured() && !notConfigured;
  const copy = COPY[mode];

  function redirectUrl(path: string): string {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError(
        "Authentication is not configured in this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    if (mode !== "reset-password" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode === "sign-up" || mode === "reset-password") {
      if (password.length < 8) {
        setError("Use at least 8 characters for your password.");
        return;
      }
      if (password !== confirmPassword) {
        setError("The two passwords do not match.");
        return;
      }
    }

    if (mode === "sign-in" && !password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw new Error(signInError.message);
        router.push(nextPath || "/dashboard");
        router.refresh();
        return;
      }

      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl(nextPath || "/dashboard"),
            data: name.trim() ? { full_name: name.trim() } : undefined,
          },
        });
        if (signUpError) throw new Error(signUpError.message);
        if (data.session) {
          router.push(nextPath || "/dashboard");
          router.refresh();
          return;
        }
        setMessage(
          "Account created. Check your inbox to verify your email address, then sign in.",
        );
        return;
      }

      if (mode === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: redirectUrl("/reset-password") },
        );
        if (resetError) throw new Error(resetError.message);
        setMessage(
          "If an account exists for that address, a password reset link is on its way.",
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setMessage("Password updated. Redirecting to your dashboard…");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function signInWithGoogle() {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Google sign-in is not configured in this deployment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl(nextPath || "/dashboard") },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#3a3a3a]">
          {copy.description}
        </p>
      </div>

      {!configured ? (
        <Alert variant="warning" className="mb-5">
          <div>
            <AlertTitle>Account features are not configured</AlertTitle>
            <AlertDescription>
              This deployment has no Supabase credentials, so sign-in cannot work.
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see{" "}
              <code>.env.example</code>) to enable email and Google
              authentication.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="danger" className="mb-5">
          <div>
            <AlertTitle>Could not continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {message ? (
        <Alert variant="success" className="mb-5">
          <div>
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="card-brutal flex flex-col gap-4 p-5 sm:p-6" noValidate>
        {mode === "sign-up" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-name">Name (optional)</Label>
            <Input
              id="auth-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={submitting}
            />
          </div>
        ) : null}

        {mode !== "reset-password" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>
        ) : null}

        {mode !== "forgot-password" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-password">
                {mode === "reset-password" ? "New password" : "Password"}
              </Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "sign-in" ? undefined : 8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
            </div>

            {mode !== "sign-in" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-confirm">Confirm password</Label>
                <Input
                  id="auth-confirm"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={submitting}
                />
              </div>
            ) : null}
          </>
        ) : null}

        <Button type="submit" variant="accent" size="lg" isLoading={submitting}>
          {copy.cta}
        </Button>

        {mode === "sign-in" || mode === "sign-up" ? (
          <>
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-t-2 border-[#0b0b0b]" />
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#6b6b6b]">
                or
              </span>
              <hr className="flex-1 border-t-2 border-[#0b0b0b]" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => void signInWithGoogle()}
              disabled={submitting}
            >
              Continue with Google
            </Button>
          </>
        ) : null}
      </form>

      <nav className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#3a3a3a]">
        {mode === "sign-in" ? (
          <>
            <Link href="/forgot-password" className="font-bold underline">
              Forgot your password?
            </Link>
            <span className="text-[#6b6b6b]">
              New here?{" "}
              <Link href="/sign-up" className="font-bold underline">
                Create an account
              </Link>
            </span>
          </>
        ) : null}
        {mode === "sign-up" ? (
          <span className="text-[#6b6b6b]">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-bold underline">
              Sign in
            </Link>
          </span>
        ) : null}
        {mode === "forgot-password" ? (
          <Link href="/sign-in" className="font-bold underline">
            Back to sign in
          </Link>
        ) : null}
      </nav>

      {mode === "sign-up" ? (
        <p className="mt-5 text-xs leading-relaxed text-[#6b6b6b]">
          By creating an account you agree to the{" "}
          <Link href="/legal/terms" className="font-bold underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="font-bold underline">
            Privacy Policy
          </Link>
          .
        </p>
      ) : null}

      <p className="mt-4">
        <Badge variant="muted">Demo build</Badge>
      </p>
    </div>
  );
}
