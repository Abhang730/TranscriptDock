import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { refund } from "@/lib/legal/refund";

export const metadata: Metadata = { title: "Refund and Cancellation Policy" };

export default function RefundPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={refund} />
      </main>
      <Footer />
    </>
  );
}
