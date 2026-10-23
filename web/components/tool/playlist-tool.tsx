"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Download,
  FileArchive,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { ItemStatusBadge, JobStatusBadge } from "@/components/tool/status-badge";
import { ApiRequestError, apiFetch, downloadFile } from "@/lib/api";
import { TRANSCRIPT_LANGUAGES, FREE_TIER, SUPPORT_PACK } from "@/lib/brand";
import { describeSourceError } from "@/lib/urls";
import { isJobActive, useJobPolling } from "@/lib/use-job";
import type {
  CreditBalance,
  PlaylistPreview,
  PublicConfig,
  TranscriptJob,
} from "@/lib/types";

interface PlaylistToolProps {
  initialUrl: string;
  initialLanguage: string;
  signedIn: boolean;
}

export function PlaylistTool({
  initialUrl,
  initialLanguage,
  signedIn,
}: PlaylistToolProps) {
  const [url, setUrl] = React.useState(initialUrl);
  const [language, setLanguage] = React.useState(initialLanguage);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PlaylistPreview | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<{
    message: string;
    code: string;
    hint?: React.ReactNode;
  } | null>(null);
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [batchLimit, setBatchLimit] = React.useState<number>(
    signedIn ? SUPPORT_PACK.maxVideosPerBatch : FREE_TIER.maxVideosPerBatch,
  );

  const { job, setJob, pollError, refresh } = useJobPolling(null);
  const autoLoaded = React.useRef(false);

  React.useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([
      apiFetch<PublicConfig>("/api/config").catch(() => null),
      apiFetch<CreditBalance>("/api/credits").catch(() => null),
    ]).then(([config, credits]) => {
      if (cancelled) return;
      if (config) {
        setBatchLimit(
          credits?.packHeld ? config.paidBatchSize : config.freeBatchSize,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const loadPreview = React.useCallback(
    async (sourceUrl: string) => {
      setError(null);
      setLoadingPreview(true);
      try {
        const result = await apiFetch<PlaylistPreview>("/api/playlists/preview", {
          method: "POST",
          body: JSON.stringify({ url: sourceUrl }),
        });
        setPreview(result);
        const allowed = result.entries
          .slice(0, batchLimit)
          .map((entry) => entry.videoId);
        setSelected(allowed);
        if (result.entries.length > batchLimit) {
          setError({
            message: `This playlist has ${result.entries.length} videos. Your current limit is ${batchLimit} per batch, so only the first ${batchLimit} are pre-selected.`,
            code: "batch_limit",
          });
        }
      } catch (caught) {
        setError(toToolError(caught));
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    },
    [batchLimit],
  );

  React.useEffect(() => {
    if (autoLoaded.current || !initialUrl) return;
    autoLoaded.current = true;
    void loadPreview(initialUrl);
  }, [initialUrl, loadPreview]);

  function handlePreview(event: React.FormEvent) {
    event.preventDefault();
    const message = describeSourceError(url, "playlist");
    if (message) {
      setFormError(message);
      return;
    }
    setFormError(null);
    setJob(null);
    void loadPreview(url.trim());
  }

  async function startJob() {
    if (!preview) return;
    if (selected.length === 0) {
      setError({
        message: "Select at least one video to process.",
        code: "no_selection",
      });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiFetch<TranscriptJob>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          mode: "playlist",
          url: url.trim(),
          language,
          selectedVideoIds: selected,
        }),
      });
      setJob(created);
    } catch (caught) {
      setError(toToolError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function retryFailed() {
    if (!job) return;
    setError(null);
    try {
      const updated = await apiFetch<TranscriptJob>(`/api/jobs/${job.id}/retry`, {
        method: "POST",
      });
      setJob(updated);
    } catch (caught) {
      setError(toToolError(caught));
    }
  }

  async function exportJob(format: string) {
    if (!job) return;
    setExporting(format);
    setError(null);
    try {
      await downloadFile(
        `/api/jobs/${job.id}/export?format=${format}`,
        `transcriptdock-playlist.${format}`,
      );
    } catch (caught) {
      setError(toToolError(caught));
    } finally {
      setExporting(null);
    }
  }

  async function exportItem(itemId: string) {
    if (!job) return;
    setExporting(itemId);
    setError(null);
    try {
      await downloadFile(
        `/api/jobs/${job.id}/items/${itemId}/export?format=txt`,
        "transcript.txt",
      );
    } catch (caught) {
      setError(toToolError(caught));
    } finally {
      setExporting(null);
    }
  }

  function toggle(videoId: string) {
    setSelected((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId],
    );
  }

  const active = isJobActive(job);
  const processed = job ? job.succeededItems + job.failedItems : 0;
  const hasFailures = (job?.failedItems ?? 0) > 0;
  const succeededItems = job?.items.filter((item) => item.status === "success") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
        <form onSubmit={handlePreview} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playlist-url">Playlist URL</Label>
            <Input
              id="playlist-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/playlist?list=PLAYLIST_ID"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (formError) setFormError(null);
              }}
              aria-invalid={formError ? true : undefined}
              aria-describedby={formError ? "playlist-url-error" : undefined}
              disabled={loadingPreview || submitting || active}
            />
            {formError ? (
              <p
                id="playlist-url-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs font-bold text-[#d22b2b]"
              >
                <AlertCircle size={12} strokeWidth={3} aria-hidden />
                {formError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <Label htmlFor="playlist-language">Language</Label>
              <Select
                id="playlist-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                disabled={loadingPreview || submitting || active}
              >
                {TRANSCRIPT_LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              isLoading={loadingPreview}
              className="sm:ml-auto"
            >
              <ListChecks size={16} strokeWidth={3} aria-hidden />
              Load playlist
            </Button>
          </div>

          <p className="text-xs text-[#6b6b6b]">
            Playlists are processed as background jobs with bounded concurrency,
            so the browser never holds a request open for the whole batch. Batch
            limit: {batchLimit} videos.
          </p>
        </form>
      </Card>

      {error ? (
        <Alert
          variant={
            error.code === "insufficient_credits" || error.code === "batch_limit"
              ? "warning"
              : "danger"
          }
        >
          <div>
            <AlertTitle>{errorTitle(error.code)}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            {error.hint ? <div className="mt-2 text-sm">{error.hint}</div> : null}
          </div>
        </Alert>
      ) : null}

      {!signedIn ? (
        <Alert variant="warning">
          <div>
            <AlertTitle>Sign in to process a playlist</AlertTitle>
            <AlertDescription>
              You can preview a demo playlist without an account, but processing
              requires sign-in so the job, credits and results belong to a real
              account.{" "}
              <Link
                href={`/sign-in?next=${encodeURIComponent(`/playlist?url=${url}`)}`}
                className="font-bold underline"
              >
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/sign-up" className="font-bold underline">
                create an account
              </Link>
              .
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {preview ? (
        <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0b0b0b]">
                {preview.title}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.04em] text-[#6b6b6b]">
                {preview.entries.length} videos · provider: {preview.provider}
                {preview.isDemo ? " (demo)" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelected(
                    selected.length === preview.entries.length
                      ? []
                      : preview.entries.map((entry) => entry.videoId),
                  )
                }
              >
                {selected.length === preview.entries.length
                  ? "Clear all"
                  : "Select all"}
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => void startJob()}
                isLoading={submitting || active}
                disabled={!signedIn || selected.length === 0}
                title={
                  !signedIn
                    ? "Sign in to process a playlist"
                    : selected.length === 0
                      ? "Select at least one video"
                      : undefined
                }
              >
                Process {selected.length} selected
              </Button>
            </div>
          </div>

          <ul className="mt-4 divide-y-2 divide-[#efece2] border-2 border-[#0b0b0b]">
            {preview.entries.map((entry, index) => {
              const checked = selected.includes(entry.videoId);
              const disabled = !signedIn || active;
              return (
                <li key={entry.videoId} className="flex items-start gap-3 p-3">
                  <input
                    type="checkbox"
                    id={`entry-${entry.videoId}`}
                    checked={checked}
                    onChange={() => toggle(entry.videoId)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0b0b0b]"
                  />
                  <label
                    htmlFor={`entry-${entry.videoId}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <span className="font-bold text-[#0b0b0b]">
                      {String(index + 1).padStart(2, "0")}. {entry.title}
                    </span>
                    <span className="ml-2 break-all text-xs text-[#6b6b6b]">
                      {entry.videoId}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {!signedIn ? (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.04em] text-[#6b6b6b]">
              Preview only — selection and processing unlock after sign-in.
            </p>
          ) : null}
        </Card>
      ) : null}

      {job ? (
        <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status={job.status} />
              <Badge variant="neutral">
                {job.succeededItems} done · {job.failedItems} failed ·{" "}
                {job.totalItems - processed} pending
              </Badge>
              {job.isDemo ? <Badge variant="muted">Demo provider</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void exportJob("txt")}
                isLoading={exporting === "txt"}
                disabled={succeededItems.length === 0}
              >
                <Download size={14} strokeWidth={3} aria-hidden />
                Combined TXT
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void exportJob("zip")}
                isLoading={exporting === "zip"}
                disabled={succeededItems.length === 0}
              >
                <FileArchive size={14} strokeWidth={3} aria-hidden />
                ZIP
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void exportJob("csv")}
                isLoading={exporting === "csv"}
                disabled={!hasFailures}
                title={hasFailures ? "Download the failure report" : "No failed items"}
              >
                <Download size={14} strokeWidth={3} aria-hidden />
                Failure CSV
              </Button>
              {hasFailures && !active ? (
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => void retryFailed()}
                >
                  <RotateCcw size={14} strokeWidth={3} aria-hidden />
                  Retry failed
                </Button>
              ) : null}
            </div>
          </div>

          <Progress
            className="mt-4"
            value={processed}
            max={Math.max(job.totalItems, 1)}
            label={`Progress ${processed}/${job.totalItems}`}
          />

          {pollError ? (
            <p className="mt-3 text-xs font-bold text-[#b45309]">
              {pollError}{" "}
              <button
                type="button"
                onClick={() => void refresh()}
                className="underline"
              >
                Retry
              </button>
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2">
            {job.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-[4px] border-2 border-[#0b0b0b] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0b0b0b]">
                    {String(item.position).padStart(2, "0")}. {item.title}
                  </p>
                  {item.errorMessage ? (
                    <p className="mt-1 text-xs text-[#d22b2b]">
                      {item.errorMessage}
                    </p>
                  ) : item.transcript ? (
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      {item.transcript.segmentCount} segments ·{" "}
                      {item.transcript.language ?? "auto"}
                    </p>
                  ) : null}
                  {item.retryCount > 0 ? (
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      Retried {item.retryCount}×
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ItemStatusBadge status={item.status} />
                  {item.transcript ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void exportItem(item.id)}
                      isLoading={exporting === item.id}
                    >
                      <Download size={14} strokeWidth={3} aria-hidden />
                      TXT
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {job.isDemo ? (
            <p className="mt-4 border-t-2 border-[#0b0b0b] pt-3 text-xs text-[#6b6b6b]">
              Demo mode: titles and transcripts come from the demo provider. Some
              items fail on purpose so the retry and failure-report flow can be
              tested without a real caption source.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function toToolError(caught: unknown): {
  message: string;
  code: string;
  hint?: React.ReactNode;
} {
  if (caught instanceof ApiRequestError) {
    if (caught.status === 401) {
      return {
        message: caught.message,
        code: "unauthenticated",
        hint: (
          <Link href="/sign-in?next=%2Fplaylist" className="font-bold underline">
            Sign in and try again
          </Link>
        ),
      };
    }
    if (caught.status === 402 || caught.code === "insufficient_credits") {
      return {
        message: caught.message,
        code: "insufficient_credits",
        hint: (
          <Link href="/pricing" className="font-bold underline">
            See how credits work
          </Link>
        ),
      };
    }
    return { message: caught.message, code: caught.code };
  }
  return {
    message:
      caught instanceof Error
        ? caught.message
        : "The request could not be completed.",
    code: "unknown_error",
  };
}

function errorTitle(code: string): string {
  switch (code) {
    case "invalid_url":
      return "That link cannot be processed";
    case "unsupported_host":
      return "Unsupported source";
    case "playlist_empty":
      return "That playlist is empty";
    case "batch_limit":
      return "Batch limit";
    case "insufficient_credits":
      return "Not enough credits";
    case "unauthenticated":
      return "Sign in required";
    case "service_unavailable":
      return "Processing service unavailable";
    default:
      return "Something went wrong";
  }
}
