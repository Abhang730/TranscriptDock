import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { terms } from "@/lib/legal/terms";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={terms} />
      </main>
      <Footer />
    </>
  );
}
