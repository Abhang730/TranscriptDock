"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiRequestError, apiFetch } from "@/lib/api";

export function DeleteJobButton({
  jobId,
  redirectTo,
}: {
  jobId: string;
  /** When provided, navigate here after deleting. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    const confirmed = window.confirm(
      "Delete this job and its stored transcripts? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await apiFetch<void>(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiRequestError
          ? caught.message
          : "The job could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void remove()}
        isLoading={deleting}
      >
        <Trash2 size={14} strokeWidth={3} aria-hidden />
        Delete
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-bold text-[#d22b2b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
