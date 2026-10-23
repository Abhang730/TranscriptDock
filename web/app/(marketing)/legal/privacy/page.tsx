import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { privacy } from "@/lib/legal/privacy";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={privacy} />
      </main>
      <Footer />
    </>
  );
}
