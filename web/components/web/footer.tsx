import Link from "next/link";
import { Logo } from "./logo";
import { SUPPORT_EMAIL, LEGAL_EFFECTIVE_DATE, BRAND_NAME } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t-2 border-[#0b0b0b] bg-[#efece2] mt-auto">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo size="sm" showWordmark={false} />
            <p className="mt-3 text-sm text-[#3a3a3a] leading-relaxed max-w-xs">
              {BRAND_NAME} turns video captions into clean, searchable transcripts.
            </p>
            <p className="mt-4 text-xs text-[#6b6b6b] font-bold uppercase tracking-[0.06em]">
              Demo mode — no real YouTube access
            </p>
          </div>

          <div>
            <h4 className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] mb-3">
              Product
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li><FooterLink href="/how-it-works">How it works</FooterLink></li>
              <li><FooterLink href="/pricing">Pricing</FooterLink></li>
              <li><FooterLink href="/faq">FAQ</FooterLink></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] mb-3">
              Account
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li><FooterLink href="/sign-in">Sign in</FooterLink></li>
              <li><FooterLink href="/sign-up">Create account</FooterLink></li>
              <li><FooterLink href="/dashboard">Dashboard</FooterLink></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] mb-3">
              Legal
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li><FooterLink href="/legal/privacy">Privacy Policy</FooterLink></li>
              <li><FooterLink href="/legal/terms">Terms of Service</FooterLink></li>
              <li><FooterLink href="/legal/acceptable-use">Acceptable Use</FooterLink></li>
              <li><FooterLink href="/legal/refund">Refund Policy</FooterLink></li>
              <li><FooterLink href="/legal/cookie-notice">Cookie notice</FooterLink></li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-2 border-[#0b0b0b]" />

        <div className="flex flex-col gap-3 text-xs text-[#6b6b6b]">
          <p className="font-bold uppercase tracking-[0.06em] text-[#3a3a3a]">
            TranscriptDock — {LEGAL_EFFECTIVE_DATE}
          </p>
          <p>
            Demo service for illustration only. Not affiliated with or endorsed by YouTube,
            Google, Supabase, Razorpay, or any other third party mentioned. The operator name,
            contact email, and legal status are placeholders and must be replaced before any
            commercial launch.
          </p>
          <p className="font-bold">Contact: {SUPPORT_EMAIL}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-[#3a3a3a] hover:text-[#0b0b0b] font-bold transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-[#e6ff00] focus-visible:outline-offset-2"
    >
      {children}
    </Link>
  );
}
