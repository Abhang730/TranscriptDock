import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Languages,
  ListVideo,
  Video,
} from "lucide-react";
import { SiteHeader, Footer, DemoProviderNotice } from "@/components/web";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabTrigger, TabsContent } from "@/components/ui/tabs";
import { TranscriptViewerDemo } from "@/components/web/transcript-preview";
import { HeroInput } from "@/components/web/hero-input";
import { HowItWorks } from "@/components/web/how-it-works";
import { Features } from "@/components/web/features";
import { Pricing } from "@/components/web/pricing";
import { FAQ } from "@/components/web/faq";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — clean, searchable transcripts`,
  description: BRAND_TAGLINE,
};

const HIGHLIGHTS = [
  {
    icon: Video,
    label: "Single videos",
    description: "One link in, one clean transcript out.",
  },
  {
    icon: ListVideo,
    label: "Playlists",
    description: "Batch a playlist, keep the original order.",
  },
  {
    icon: Languages,
    label: "Languages",
    description: "Auto, English, Hindi and Marathi where available.",
  },
  {
    icon: Download,
    label: "Exports",
    description: "TXT, SRT, VTT and CSV when the data supports it.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden pb-12 pt-10 sm:pb-16 sm:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-50"
          >
            <div className="absolute -left-24 top-0 h-72 w-72 rotate-45 border-2 border-[#0b0b0b] bg-[#efece2]" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 border-2 border-[#0b0b0b] bg-[#e6ff00]/40" />
          </div>

          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
              <div className="lg:w-5/12">
                <Badge variant="accent" className="mb-4">
                  Demo build — no YouTube access
                </Badge>
                <h1 className="text-4xl leading-[1.05] tracking-[-0.03em] text-[#0b0b0b] sm:text-6xl">
                  Turn video captions into{" "}
                  <span className="text-[#1a46ff]">clean, searchable</span>{" "}
                  transcripts.
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#3a3a3a] sm:text-xl">
                  Paste a video or playlist link, choose the language you want,
                  and get a readable transcript you can copy, search or download
                  as TXT, SRT, VTT or CSV.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="accent">
                    <Link href="/sign-up">Create a free account</Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost">
                    <Link href="/how-it-works">See how it works</Link>
                  </Button>
                </div>

                <ul className="mt-8 grid grid-cols-1 gap-4 text-sm text-[#3a3a3a] sm:grid-cols-2">
                  {HIGHLIGHTS.map((item) => (
                    <li key={item.label} className="flex gap-3">
                      <item.icon
                        size={18}
                        strokeWidth={2.5}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-[#1a46ff]"
                      />
                      <div>
                        <p className="font-extrabold text-[#0b0b0b]">
                          {item.label}
                        </p>
                        <p className="text-[#6b6b6b]">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:w-7/12">
                <div className="card-brutal p-6 sm:p-8">
                  <Tabs defaultValue="single">
                    <TabsList aria-label="Input mode">
                      <TabTrigger value="single">Single video</TabTrigger>
                      <TabTrigger value="playlist">Playlist</TabTrigger>
                    </TabsList>
                    <TabsContent value="single">
                      <HeroInput mode="video" />
                    </TabsContent>
                    <TabsContent value="playlist">
                      <HeroInput mode="playlist" />
                    </TabsContent>
                  </Tabs>

                  <div className="mt-8 border-t-2 border-[#0b0b0b] pt-6">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="text-sm font-extrabold uppercase tracking-[0.06em] text-[#0b0b0b]">
                        Sample preview
                      </h2>
                      <Badge variant="muted">Demonstration data</Badge>
                    </div>
                    <TranscriptViewerDemo />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DemoProviderNotice />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
