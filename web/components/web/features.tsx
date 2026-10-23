import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const featureGroups = [
  {
    title: "Transcript formats",
    items: [
      {
        name: "Plain text (TXT)",
        description: "A readable transcript with the video title, source URL, and language.",
      },
      {
        name: "Subtitles (SRT / VTT)",
        description: "Timestamped downloads when the transcript data includes segment timing.",
      },
      {
        name: "Table export (CSV)",
        description: "Row-based export when the transcript structure is meaningful for that view.",
      },
    ],
  },
  {
    title: "Language selection",
    items: [
      {
        name: "Auto",
        description: "Uses the best available caption track for the video.",
      },
      {
        name: "English, Hindi, Marathi",
        description: "Preferred languages where available, falling back to the first available track.",
      },
    ],
  },
  {
    title: "Download options",
    items: [
      {
        name: "Copy to clipboard",
        description: "Quick copy of the transcript text from the viewer.",
      },
      {
        name: "Single downloads",
        description: "Download an individual video's transcript when available.",
      },
      {
        name: "Combined + ZIP",
        description: "For playlists, download one combined TXT or a ZIP of individual files.",
      },
    ],
  },
  {
    title: "Processing history",
    items: [
      {
        name: "Signed-in dashboard",
        description: "Your recent jobs and completed transcripts, limited to your account.",
      },
      {
        name: "Retry and recover",
        description: "Retry recoverable failures on individual items where the backend supports it.",
      },
      {
        name: "Delete your data",
        description: "Remove stored transcripts and job history from your account when you want.",
      },
    ],
  },
];

export function Features() {
  return (
    <section className="border-t-2 border-[#0b0b0b] bg-[#f6f4ec] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="accent" className="mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">
            A transcript tool that stays out of your way
          </h2>
          <p className="mt-4 text-lg text-[#3a3a3a] max-w-xl mx-auto">
            Designed for students, researchers, content creators, and anyone who needs clean,
            downloadable captions fast.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featureGroups.map((group) => (
            <Card key={group.title} className="p-5 h-full flex flex-col">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.04em] text-[#0b0b0b]">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-[#3a3a3a]">
                {group.items.map((item) => (
                  <li key={item.name} className="flex gap-3">
                    <span className="mt-0.5 h-3 w-3 rounded-full border-2 border-[#0b0b0b] bg-[#e6ff00] shrink-0" />
                    <div>
                      <p className="font-bold text-[#0b0b0b]">{item.name}</p>
                      <p className="text-[#6b6b6b]">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
