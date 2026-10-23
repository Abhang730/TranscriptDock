"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await createBrowserSupabase()?.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" onClick={() => void signOut()} isLoading={busy}>
      Sign out
    </Button>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [confirmation, setConfirmation] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch<void>("/api/account", { method: "DELETE" });
      await createBrowserSupabase()?.auth.signOut();
      router.push("/?account=deleted");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The account could not be deleted.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="delete-confirmation">
          Type DELETE to confirm
        </Label>
        <Input
          id="delete-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={busy}
        />
      </div>
      <Button
        variant="ghost"
        className="w-fit border-[#d22b2b] text-[#d22b2b] hover:bg-[#d22b2b] hover:text-white"
        disabled={confirmation !== "DELETE" || busy}
        isLoading={busy}
        onClick={() => void remove()}
      >
        Delete my account
      </Button>
      {error ? (
        <Alert variant="danger">
          <div>
            <AlertTitle>Deletion failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
