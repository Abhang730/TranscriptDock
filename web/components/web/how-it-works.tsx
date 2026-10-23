import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    n: "01",
    title: "Paste a link",
    body: "Drop in a single YouTube video URL or a playlist URL. The page validates the link before anything runs.",
    color: "accent",
  },
  {
    n: "02",
    title: "Pick a language",
    body: "Choose Auto, English, Hindi, or Marathi. If your chosen language is available, the transcript uses it. If not, it falls back to the first available track.",
    color: "blue",
  },
  {
    n: "03",
    title: "Read, copy, download",
    body: "Review the transcript in the viewer. Copy it, download it as TXT, or export SRT/VTT/CSV when timestamps are available.",
    color: "ink",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t-2 border-[#0b0b0b] bg-[#efece2] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="blue" className="mb-4">How it works</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">
            Three steps, no sign-up wall
          </h2>
          <p className="mt-4 text-lg text-[#3a3a3a] max-w-xl mx-auto">
            You can understand the whole workflow without creating an account. Signing in unlocks
            your processing history and downloads.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.n} className="p-6 h-full flex flex-col">
              <div className={`text-5xl font-extrabold tracking-[-0.03em] text-[#efece2] ${step.color === "accent" ? "text-[#e6ff00]" : step.color === "blue" ? "text-[#1a46ff]" : "text-[#0b0b0b]"}`}>
                {step.n}
              </div>
              <h3 className="text-xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] mt-3">
                {step.title}
              </h3>
              <p className="text-sm text-[#3a3a3a] leading-relaxed mt-2 flex-1">
                {step.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="blue">
            <Link href="/sign-up">Start transcribing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
