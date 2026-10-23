"use client";

import * as React from "react";
import { Check, Copy, Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { downloadFile } from "@/lib/api";
import type { Transcript } from "@/lib/types";

interface TranscriptViewProps {
  jobId: string;
  itemId: string;
  transcript: Transcript;
}

export function TranscriptView({ jobId, itemId, transcript }: TranscriptViewProps) {
  const [copied, setCopied] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [pendingFormat, setPendingFormat] = React.useState<string | null>(null);

  const normalisedQuery = query.trim().toLowerCase();
  const segments = transcript.segments.filter((segment) =>
    normalisedQuery ? segment.text.toLowerCase().includes(normalisedQuery) : true,
  );
  const matchCount = normalisedQuery ? segments.length : transcript.segmentCount;

  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setDownloadError(
        "Your browser blocked clipboard access. Select the transcript text manually.",
      );
    }
  }

  async function download(format: string) {
    setDownloadError(null);
    setPendingFormat(format);
    try {
      await downloadFile(
        `/api/jobs/${jobId}/items/${itemId}/export?format=${format}`,
        `transcript-${transcript.videoId}.${format}`,
      );
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "The download failed.",
      );
    } finally {
      setPendingFormat(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={transcript.isDemo ? "muted" : "blue"}>
          {transcript.isDemo ? "Demo data" : "Provider transcript"}
        </Badge>
        <Badge variant="neutral">{transcript.language ?? "auto"}</Badge>
        <Badge variant="neutral">{transcript.segmentCount} segments</Badge>
        {transcript.isTimestamped ? (
          <Badge variant="accent">Timestamped</Badge>
        ) : (
          <Badge variant="muted">No timestamps</Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            strokeWidth={2.5}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search inside this transcript"
            aria-label="Search transcript"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? (
              <Check size={14} strokeWidth={3} aria-hidden />
            ) : (
              <Copy size={14} strokeWidth={3} aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          {(["txt", "srt", "vtt", "csv"] as const).map((format) => {
            const disabled =
              (format === "srt" || format === "vtt") && !transcript.isTimestamped;
            return (
              <Button
                key={format}
                variant="ghost"
                size="sm"
                onClick={() => void download(format)}
                disabled={disabled}
                isLoading={pendingFormat === format}
                title={
                  disabled
                    ? `No timestamps available, so ${format.toUpperCase()} cannot be generated.`
                    : `Download ${format.toUpperCase()}`
                }
              >
                <Download size={14} strokeWidth={3} aria-hidden />
                {format.toUpperCase()}
              </Button>
            );
          })}
        </div>
      </div>

      {normalisedQuery ? (
        <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#6b6b6b]">
          {matchCount} matching segment{matchCount === 1 ? "" : "s"}
        </p>
      ) : null}

      {downloadError ? (
        <p role="alert" className="text-xs font-bold text-[#d22b2b]">
          {downloadError}
        </p>
      ) : null}

      <Card className="overflow-hidden p-0 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
        <div className="max-h-[520px] overflow-y-auto">
          {segments.length > 0 ? (
            <ol className="divide-y-2 divide-[#efece2]">
              {segments.map((segment, index) => (
                <li
                  key={`${segment.start}-${index}`}
                  className="flex gap-4 px-4 py-3 text-sm leading-relaxed"
                >
                  <span className="w-16 shrink-0 font-mono text-xs text-[#6b6b6b]">
                    {formatTime(segment.start)}
                  </span>
                  <span className="text-[#0b0b0b]">{segment.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-5 text-sm text-[#6b6b6b]">
              {normalisedQuery
                ? "No segments match your search."
                : transcript.text}
            </p>
          )}
        </div>
      </Card>

      <details className="rounded-[4px] border-2 border-[#0b0b0b] bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#0b0b0b] focus-visible:outline-2 focus-visible:outline-[#e6ff00]">
          Plain-text transcript
        </summary>
        <pre className="max-h-[360px] overflow-auto border-t-2 border-[#0b0b0b] p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#0b0b0b]">
          {transcript.text}
        </pre>
      </details>
    </div>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
