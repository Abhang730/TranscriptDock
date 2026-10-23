import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { PlaylistTool } from "@/components/tool/playlist-tool";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Playlist transcripts",
  description:
    "Process a playlist as bounded batch jobs, then download individual files or a ZIP.",
};

interface PageProps {
  searchParams: Promise<{ url?: string; lang?: string }>;
}

const ALLOWED_LANGUAGES = new Set(["auto", "en", "hi", "mr"]);

export default async function PlaylistPage({ searchParams }: PageProps) {
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
            <Badge variant="blue" className="mb-3">
              Playlist
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-4xl">
              Batch a playlist, keep the order
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#3a3a3a]">
              Load the playlist, choose the videos you need, and process them as
              a resilient batch with persisted per-video statuses.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
          <PlaylistTool
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
