"use client";

import * as React from "react";
import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function TranscriptViewerDemo() {
  const text = DEMO_TRANSCRIPT;
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked clipboard access. Select the text and copy it manually.");
    }
  }

  function handleDownload() {
    const blob = new Blob([`${DEMO_TITLE}\n${DEMO_SOURCE}\n\n${text}\n`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "transcriptdock-sample-transcript.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="accent">DEMO</Badge>
          <span className="text-xs font-bold uppercase tracking-[0.04em] text-[#3a3a3a]">
            Sample transcript · 4 segments
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check size={14} strokeWidth={3} aria-hidden />
            ) : (
              <Copy size={14} strokeWidth={3} aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download size={14} strokeWidth={3} aria-hidden />
            TXT
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden bg-[#faf8f2] p-0 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
        <div className="border-b-2 border-[#0b0b0b] bg-[#efece2] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border-2 border-[#0b0b0b] bg-[#1a46ff] text-sm font-extrabold text-white">
              SC
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#0b0b0b]">{DEMO_TITLE}</p>
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#6b6b6b]">
                {DEMO_SOURCE} · illustrative data
              </p>
            </div>
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#0b0b0b]">
            {text}
          </pre>
        </div>
      </Card>

      {error ? (
        <p role="alert" className="mt-2 text-xs font-bold text-[#d22b2b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const DEMO_TITLE = "Science of Climate Feedback Loops";
const DEMO_SOURCE = "youtu.be/demo-climate-001";

const DEMO_TRANSCRIPT = `Today we're going to talk about feedback loops in the climate system. A feedback loop is any process that can amplify or dampen the effects of an initial change.

The clearest example is the ice-albedo effect. When ice melts, it exposes darker water or land underneath. Darker surfaces absorb more sunlight, which leads to more warming, which leads to more melting.

Another important feedback involves water vapour. Warmer air can hold more moisture, and since water vapour is itself a greenhouse gas, that extra moisture traps additional heat.

These feedbacks do not act in isolation. They interact with clouds, ocean circulation, and vegetation, which is why projections include a range rather than a single number.`;
