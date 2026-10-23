import type { Metadata } from "next";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const webMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${BRAND_NAME} — Turn video captions into clean, searchable transcripts`,
    template: `%s — ${BRAND_NAME}`,
  },
  description: BRAND_TAGLINE,
  authors: [{ name: "TranscriptDock operator (placeholder)" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Turn video captions into clean, searchable transcripts`,
    description: BRAND_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Turn video captions into clean, searchable transcripts`,
    description: BRAND_TAGLINE,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  // TODO(operator): add real contact, organization, and security policy metadata
  // before commercial launch. Do not invent an organization name, address, or
  // registration number here.
};
