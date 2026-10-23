import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { Pricing as PricingSection } from "@/components/web/pricing";
import { SupportPackCta } from "@/components/web/support-pack-cta";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SUPPORT_PACK, FREE_TIER } from "@/lib/brand";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free transcript credits plus a one-time ₹49 INR support pack. No subscription.",
};

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <PricingSection />

        <section
          id="support-pack"
          className="border-t-2 border-[#0b0b0b] bg-[#f6f4ec] py-12 sm:py-16"
        >
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Badge variant="blue" className="mb-4">
              One-time support pack
            </Badge>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-3xl">
              Buy the support pack — ₹{SUPPORT_PACK.priceInr}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3a3a3a]">
              You get {SUPPORT_PACK.credits} transcript credits, a batch limit of
              up to {SUPPORT_PACK.maxVideosPerBatch} videos and every export
              format. One successful video uses one credit. Nothing renews.
            </p>

            <div className="mt-6">
              <SupportPackCta signedIn={Boolean(user)} />
            </div>

            <Card className="mt-8 p-5 text-left hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.04em] text-[#0b0b0b]">
                What you should know before paying
              </h3>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-[#3a3a3a]">
                <li>
                  This deployment runs a demo transcript provider. Buying credits
                  today would not unlock real transcription, because real
                  retrieval is not configured. Checkout stays disabled until it
                  is.
                </li>
                <li>
                  Free accounts already include {FREE_TIER.credits} credits and a
                  batch limit of {FREE_TIER.maxVideosPerBatch} videos.
                </li>
                <li>
                  Credits are granted only after the server verifies the Razorpay
                  signature or a signed webhook. A frontend success message alone
                  never grants credits.
                </li>
                <li>
                  Refunds are covered by the{" "}
                  <a className="font-bold underline" href="/legal/refund">
                    Refund Policy
                  </a>
                  .
                </li>
              </ul>
            </Card>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.06em] text-[#6b6b6b]">
              Amount is fixed server-side at {SUPPORT_PACK.pricePaise} paise
              (₹{SUPPORT_PACK.priceInr}). The browser cannot change the price.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
