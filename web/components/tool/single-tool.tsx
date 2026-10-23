"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { JobStatusBadge } from "@/components/tool/status-badge";
import { TranscriptView } from "@/components/tool/transcript-view";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { TRANSCRIPT_LANGUAGES } from "@/lib/brand";
import { describeSourceError, parseSourceUrl } from "@/lib/urls";
import { isJobActive, useJobPolling } from "@/lib/use-job";
import type { TranscriptJob } from "@/lib/types";

interface SingleToolProps {
  initialUrl: string;
  initialLanguage: string;
  signedIn: boolean;
}

interface ToolError {
  message: string;
  code: string;
  hint?: React.ReactNode;
}

export function SingleTool({
  initialUrl,
  initialLanguage,
  signedIn,
}: SingleToolProps) {
  const [url, setUrl] = React.useState(initialUrl);
  const [language, setLanguage] = React.useState(initialLanguage);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<ToolError | null>(null);
  const { job, setJob, pollError, refresh } = useJobPolling(null);
  const autoStarted = React.useRef(false);

  const startJob = React.useCallback(
    async (sourceUrl: string, lang: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const created = await apiFetch<TranscriptJob>("/api/jobs", {
          method: "POST",
          body: JSON.stringify({ mode: "single", url: sourceUrl, language: lang }),
        });
        setJob(created);
      } catch (caught) {
        setError(toToolError(caught));
      } finally {
        setSubmitting(false);
      }
    },
    [setJob],
  );

  React.useEffect(() => {
    if (autoStarted.current) return;
    if (!initialUrl) return;
    if (parseSourceUrl(initialUrl)?.kind !== "video") return;
    autoStarted.current = true;
    void startJob(initialUrl, initialLanguage);
  }, [initialUrl, initialLanguage, startJob]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = describeSourceError(url, "video");
    if (message) {
      setFormError(message);
      return;
    }
    setFormError(null);
    setJob(null);
    void startJob(url.trim(), language);
  }

  function reset() {
    setJob(null);
    setError(null);
    setFormError(null);
    setUrl("");
    autoStarted.current = true;
  }

  const item = job?.items[0] ?? null;
  const active = isJobActive(job);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="single-url">Video URL</Label>
            <Input
              id="single-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (formError) setFormError(null);
              }}
              aria-invalid={formError ? true : undefined}
              aria-describedby={formError ? "single-url-error" : undefined}
              disabled={submitting || active}
            />
            {formError ? (
              <p
                id="single-url-error"
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
              <Label htmlFor="single-language">Language</Label>
              <Select
                id="single-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                disabled={submitting || active}
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
              isLoading={submitting || active}
              className="sm:ml-auto"
            >
              {active ? "Processing…" : "Get transcript"}
              {!active ? <ArrowRight size={16} strokeWidth={3} aria-hidden /> : null}
            </Button>
            {job ? (
              <Button type="button" variant="ghost" onClick={reset}>
                <RotateCcw size={14} strokeWidth={3} aria-hidden />
                Start over
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-[#6b6b6b]">
            {signedIn
              ? "This job is saved to your account history and uses one credit only when a transcript is produced."
              : "You are not signed in, so this single demo run will not be saved. Sign in for history and playlists."}
          </p>
        </form>
      </Card>

      {error ? (
        <Alert variant={error.code === "insufficient_credits" ? "warning" : "danger"}>
          <div>
            <AlertTitle>{errorTitle(error.code)}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            {error.hint ? <div className="mt-2 text-sm">{error.hint}</div> : null}
          </div>
        </Alert>
      ) : null}

      {pollError ? (
        <Alert variant="warning">
          <div>
            <AlertTitle>Status refresh failed</AlertTitle>
            <AlertDescription>
              {pollError}{" "}
              <button
                type="button"
                onClick={() => void refresh()}
                className="font-bold underline"
              >
                Retry now
              </button>
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {job && active ? (
        <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <JobStatusBadge status={job.status} />
            <span className="text-sm text-[#3a3a3a]">
              Fetching captions through the configured provider…
            </span>
          </div>
          <Progress
            className="mt-4"
            value={job.status === "processing" ? 0.6 : 0.2}
            max={1}
            label="Job progress"
          />
        </Card>
      ) : null}

      {job && !active && job.status === "failed" ? (
        <Alert variant="danger">
          <div>
            <AlertTitle>No transcript was produced</AlertTitle>
            <AlertDescription>
              {job.errorMessage ??
                item?.errorMessage ??
                "The provider did not return a transcript for this video."}
            </AlertDescription>
            <p className="mt-2 text-sm">
              We do not generate placeholder text and present it as a transcript.
              Check the URL, try another language, or retry the job.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => void startJob(url.trim(), language)}
            >
              <RotateCcw size={14} strokeWidth={3} aria-hidden />
              Retry
            </Button>
          </div>
        </Alert>
      ) : null}

      {job && item?.transcript ? (
        <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.01em] text-[#0b0b0b]">
                {item.transcript.title}
              </h2>
              <a
                href={item.transcript.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 block break-all text-xs font-bold uppercase tracking-[0.04em] text-[#1a46ff] underline"
              >
                {item.transcript.sourceUrl}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {job.isDemo ? <Badge variant="muted">Demo provider</Badge> : null}
              <JobStatusBadge status={job.status} />
            </div>
          </div>

          <TranscriptView
            jobId={job.id}
            itemId={item.id}
            transcript={item.transcript}
          />

          {job.isDemo ? (
            <p className="mt-4 border-t-2 border-[#0b0b0b] pt-3 text-xs text-[#6b6b6b]">
              This transcript is generated by the demo provider for interface
              testing. It is not the video&apos;s real captions.
            </p>
          ) : null}

          {signedIn ? (
            <p className="mt-3 text-xs text-[#6b6b6b]">
              Stored in your{" "}
              <Link href="/dashboard" className="font-bold underline">
                dashboard
              </Link>
              . You can delete it at any time.
            </p>
          ) : (
            <p className="mt-3 text-xs text-[#6b6b6b]">
              <Link href="/sign-up" className="font-bold underline">
                Create a free account
              </Link>{" "}
              to keep transcripts and process playlists.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function toToolError(caught: unknown): ToolError {
  if (caught instanceof ApiRequestError) {
    if (caught.status === 429) {
      return {
        message: caught.message,
        code: caught.code,
        hint: "Anonymous demo runs are rate limited. Sign in for a larger allowance.",
      };
    }
    if (caught.status === 401) {
      return {
        message: caught.message,
        code: caught.code,
        hint: (
          <Link href="/sign-in?next=%2Fsingle" className="font-bold underline">
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
    if (caught.status === 503) {
      return {
        message: caught.message,
        code: caught.code,
        hint: "The processing service may not be running. Start the FastAPI backend and try again.",
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
    case "captions_unavailable":
      return "Captions are unavailable";
    case "insufficient_credits":
      return "Not enough credits";
    case "rate_limited":
      return "Too many requests";
    case "service_unavailable":
      return "Processing service unavailable";
    default:
      return "Something went wrong";
  }
}
