import type { Metadata } from "next";
import { SiteHeader, Footer } from "@/components/web";
import { LegalView } from "@/components/web/legal-view";
import { cookie } from "@/lib/legal/cookie";

export const metadata: Metadata = { title: "Cookie and Tracking Notice" };

export default function CookieNoticePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LegalView doc={cookie} />
      </main>
      <Footer />
    </>
  );
}
