import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { acceptableUse } from "@/lib/legal/acceptable_use";

export const metadata: Metadata = { title: "Acceptable Use Policy" };

export default function AcceptableUsePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={acceptableUse} />
      </main>
      <Footer />
    </>
  );
}
