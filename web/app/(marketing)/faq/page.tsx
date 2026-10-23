import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { FAQ } from "@/components/web/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about TranscriptDock: languages, failed videos, downloads, pricing and privacy.",
};

export default function FAQPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b-2 border-[#0b0b0b] bg-[#efece2] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b]">
              Help
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#3a3a3a]">
              Straight answers about what works today, what needs a real provider,
              and how your data is handled.
            </p>
          </div>
        </section>
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
