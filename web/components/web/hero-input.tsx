"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRANSCRIPT_LANGUAGES, FREE_TIER } from "@/lib/brand";
import { describeSourceError } from "@/lib/urls";
import type { SourceKind } from "@/lib/urls";

export function HeroInput({ mode }: { mode: SourceKind }) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [language, setLanguage] = React.useState("auto");
  const [error, setError] = React.useState<string | null>(null);
  const [navigating, setNavigating] = React.useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = describeSourceError(url, mode);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setNavigating(true);
    const target = mode === "video" ? "/single" : "/playlist";
    router.push(
      `${target}?url=${encodeURIComponent(url.trim())}&lang=${encodeURIComponent(language)}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`hero-url-${mode}`}>
          {mode === "video" ? "Video URL" : "Playlist URL"}
        </Label>
        <Input
          id={`hero-url-${mode}`}
          name="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder={
            mode === "video"
              ? "https://youtu.be/VIDEO_ID"
              : "https://www.youtube.com/playlist?list=PLAYLIST_ID"
          }
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) setError(null);
          }}
          aria-describedby={error ? `hero-error-${mode}` : undefined}
          aria-invalid={error ? true : undefined}
          disabled={navigating}
        />
        {error ? (
          <p
            id={`hero-error-${mode}`}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.04em] text-[#d22b2b]"
          >
            <AlertCircle size={12} strokeWidth={3} aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <Label htmlFor={`hero-lang-${mode}`}>Language</Label>
          <Select
            id={`hero-lang-${mode}`}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            disabled={navigating}
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
          size="lg"
          variant="accent"
          isLoading={navigating}
          className="shrink-0"
        >
          {mode === "video" ? (
            <>
              <Video size={16} strokeWidth={3} aria-hidden />
              Get transcript
            </>
          ) : (
            <>
              <Play size={16} strokeWidth={3} aria-hidden />
              Open playlist
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#3a3a3a]">
        <Badge variant="muted">Demo provider</Badge>
        <span>
          The transcript is clearly labelled demonstration data. No YouTube
          request is made.
        </span>
      </div>

      <p className="text-xs text-[#6b6b6b]">
        Free accounts include {FREE_TIER.credits} credits and up to{" "}
        {FREE_TIER.maxVideosPerBatch} videos per batch. Signing in is only
        required to keep your history.
      </p>
    </form>
  );
}
