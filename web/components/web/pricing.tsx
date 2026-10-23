import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUPPORT_PACK, FREE_TIER } from "@/lib/brand";

export function Pricing() {
  return (
    <section className="border-t-2 border-[#0b0b0b] bg-[#efece2] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="blue" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">
            Free to try. One-time support pack when you want more.
          </h2>
          <p className="mt-4 text-lg text-[#3a3a3a] max-w-xl mx-auto">
            No subscription. The free tier is functional on its own. The support pack is a single
            ₹49 INR purchase that gives you a larger processing allowance.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">Free</h3>
              <Badge variant="accent">Forever</Badge>
            </div>
            <p className="text-4xl font-extrabold text-[#0b0b0b]">₹0</p>
            <p className="text-sm text-[#6b6b6b] mt-1">one-time, no recurring charge</p>

            <ul className="mt-6 flex flex-col gap-3 text-sm flex-1">
              <PriceRow check>Single-video transcription (demo mode)</PriceRow>
              <PriceRow check>Playlist transcription (demo mode)</PriceRow>
              <PriceRow check>TXT, SRT, VTT, CSV downloads</PriceRow>
              <PriceRow check>Language selection</PriceRow>
              <PriceRow dot>Up to {FREE_TIER.maxVideosPerBatch} videos per batch</PriceRow>
              <PriceRow dot>Signed-in processing history</PriceRow>
            </ul>

            <Button asChild className="mt-6" variant="ghost">
              <Link href="/sign-up">Start free</Link>
            </Button>
          </Card>

          <Card className="p-6 flex flex-col ring-2 ring-[#0b0b0b] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e6ff00] border-2 border-[#0b0b0b] rounded-[4px] px-4 py-1 text-center">
              <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-[#0b0b0b]">
                Most popular
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">Support pack</h3>
              <Badge variant="blue">One-time</Badge>
            </div>
            <p className="text-4xl font-extrabold text-[#0b0b0b]">₹{SUPPORT_PACK.priceInr}</p>
            <p className="text-sm text-[#6b6b6b] mt-1">One ₹49 INR purchase. No recurring billing.</p>

            <ul className="mt-6 flex flex-col gap-3 text-sm flex-1">
              <PriceRow check>Everything in Free</PriceRow>
              <PriceRow check>{SUPPORT_PACK.credits} transcript credits included</PriceRow>
              <PriceRow check>Up to {SUPPORT_PACK.maxVideosPerBatch} videos per batch</PriceRow>
              <PriceRow check>Priority support route</PriceRow>
              <PriceRow dot>Configurable by server-side settings</PriceRow>
              <PriceRow dot>Refundable under the refund policy</PriceRow>
            </ul>

            <div className="mt-6">
              <Button asChild variant="accent" size="lg">
                <Link href="/pricing#support-pack">Buy support pack — ₹{SUPPORT_PACK.priceInr}</Link>
              </Button>
              <p className="mt-2 text-xs text-[#6b6b6b]">
                Payment is handled by Razorpay. Account approval and webhook verification are
                required before this is live in production.
              </p>
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="text-xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">
              A few things to know
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-[#3a3a3a]">
              <li>
                <p className="font-bold text-[#0b0b0b]">Not a subscription</p>
                <p className="text-[#6b6b6b]">The support pack is purchased once. It does not renew.</p>
              </li>
              <li>
                <p className="font-bold text-[#0b0b0b]">Credits are per successfully processed video</p>
                <p className="text-[#6b6b6b]">Where the provider and backend permit reliable accounting, you are charged only for videos that complete successfully.</p>
              </li>
              <li>
                <p className="font-bold text-[#0b0b0b]">Transparent limits</p>
                <p className="text-[#6b6b6b]">The free tier, batch size, and pack credits are described plainly. We do not advertise internal provider rate limits in marketing copy.</p>
              </li>
              <li>
                <p className="font-bold text-[#0b0b0b]">Demo before you buy</p>
                <p className="text-[#6b6b6b]">Try the demo transcript flow before deciding to purchase. A purchase only grants credits after the backend verifies the payment.</p>
              </li>
            </ul>
            <Button asChild className="mt-6" variant="ghost">
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </Card>
        </div>

        <p className="mt-8 text-xs text-[#6b6b6b] text-center font-bold uppercase tracking-[0.06em]">
          Entitlements and batch limits are configurable server-side. If a pack entitlement is not
          configured, production checkout stays disabled until it is.
        </p>
      </div>
    </section>
  );
}

function PriceRow({
  check,
  dot,
  children,
}: {
  check?: boolean;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 shrink-0 ${check ? "text-[#e6ff00]" : dot ? "text-[#c9c7bd]" : ""}`}>
        {check ? <CheckIcon /> : dot ? <DotIcon /> : null}
      </span>
      <span>{children}</span>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
