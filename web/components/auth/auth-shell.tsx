import { SiteHeader, Footer } from "@/components/web";
import { Card } from "@/components/ui/card";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div className="order-2 lg:order-1">
            <Card className="h-full bg-[#efece2] p-6 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-8">
              <h2 className="text-xl font-extrabold text-[#0b0b0b]">
                What you get with an account
              </h2>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-[#3a3a3a]">
                <li>• 20 free transcript credits to start.</li>
                <li>• Saved single-video and playlist job history.</li>
                <li>• Playlist batches with per-video retry and ZIP export.</li>
                <li>• Account settings, transcript deletion and account deletion.</li>
                <li>• Anything you process stays visible only to you.</li>
              </ul>
              <p className="mt-6 border-t-2 border-[#0b0b0b] pt-4 text-xs leading-relaxed text-[#6b6b6b]">
                Processing currently uses a labelled demo provider. Your account
                and job records are real; the transcript text is demonstration
                data until an authorized provider is configured.
              </p>
            </Card>
          </div>
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
