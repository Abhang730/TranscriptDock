import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { contact } from "@/lib/legal/contact";

export const metadata: Metadata = { title: "Contact and Support" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={contact} />
      </main>
      <Footer />
    </>
  );
}
