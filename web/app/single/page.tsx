import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { SingleTool } from "@/components/tool/single-tool";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Single video transcript",
  description:
    "Paste a video URL, choose a language and get a clean, downloadable transcript.",
};

interface PageProps {
  searchParams: Promise<{ url?: string; lang?: string }>;
}

const ALLOWED_LANGUAGES = new Set(["auto", "en", "hi", "mr"]);

export default async function SinglePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getSessionUser();
  const initialUrl = typeof params.url === "string" ? params.url.slice(0, 2048) : "";
  const requestedLanguage =
    typeof params.lang === "string" && ALLOWED_LANGUAGES.has(params.lang)
      ? params.lang
      : "auto";

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b-2 border-[#0b0b0b] bg-[#efece2] px-5 py-10 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <Badge variant="accent" className="mb-3">
              Single video
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-4xl">
              One link, one clean transcript
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#3a3a3a]">
              This deployment uses a labelled demo provider, so transcripts are
              demonstration data. The workflow, validation, exports and account
              handling are real.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
          <SingleTool
            initialUrl={initialUrl}
            initialLanguage={requestedLanguage}
            signedIn={Boolean(user)}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
