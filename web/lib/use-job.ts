"use client";

import * as React from "react";
import { apiFetch } from "./api";
import type { TranscriptJob } from "./types";

const TERMINAL: TranscriptJob["status"][] = [
  "completed",
  "partial",
  "failed",
  "cancelled",
];

export function isJobActive(job: TranscriptJob | null): boolean {
  return Boolean(job && !TERMINAL.includes(job.status));
}

/**
 * Keeps a job up to date while it is processing.
 * Polls the BFF route instead of holding a long request open.
 */
export function useJobPolling(initial: TranscriptJob | null) {
  const [job, setJob] = React.useState<TranscriptJob | null>(initial);
  const [pollError, setPollError] = React.useState<string | null>(null);
  const jobId = job?.id ?? null;
  const active = isJobActive(job);

  const refresh = React.useCallback(async () => {
    if (!jobId) return;
    try {
      const next = await apiFetch<TranscriptJob>(`/api/jobs/${jobId}`);
      setJob(next);
      setPollError(null);
    } catch (error) {
      setPollError(
        error instanceof Error ? error.message : "Could not refresh job status.",
      );
    }
  }, [jobId]);

  React.useEffect(() => {
    if (!jobId || !active) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (!cancelled) void refresh();
    }, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, jobId, refresh]);

  return { job, setJob, refresh, pollError };
}
