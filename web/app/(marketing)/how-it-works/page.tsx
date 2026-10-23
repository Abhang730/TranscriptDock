import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, Footer } from "@/components/web";
import { HowItWorks } from "@/components/web/how-it-works";
import { DemoProviderNotice } from "@/components/web/demo-notice";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Three steps to a clean transcript: paste a link, pick a language, read or download.",
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b-2 border-[#0b0b0b] bg-[#efece2] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b]">
              Workflow
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-5xl">
              From a link to a transcript in three steps
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#3a3a3a]">
              No account is needed to understand the product. An account is only
              needed to keep your processing history and to run playlist batches.
            </p>
          </div>
        </section>
        <DemoProviderNotice />
        <HowItWorks />
        <section className="border-t-2 border-[#0b0b0b] px-5 py-12 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#0b0b0b]">
                Try the single-video flow
              </h2>
              <p className="mt-1 text-sm text-[#3a3a3a]">
                It runs on a labelled demo provider and needs no sign-in.
              </p>
            </div>
            <Button asChild variant="accent" size="lg">
              <Link href="/single">Open the transcript tool</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
