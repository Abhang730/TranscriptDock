import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader, Footer } from "@/components/web";
import { DeleteAccount, SignOutButton } from "@/components/account/account-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/supabase/server";
import { SUPPORT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = { title: "Account settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=%2Fsettings");

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
          <header>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b]">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b]">
              Settings
            </h1>
            <p className="mt-2 text-sm text-[#3a3a3a]">
              Your profile details come from Supabase Auth. Email changes,
              password resets and Google account linking are handled there.
            </p>
          </header>

          <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
            <h2 className="text-lg font-extrabold text-[#0b0b0b]">Profile</h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#efece2] pb-2">
                <dt className="font-bold text-[#6b6b6b]">Email</dt>
                <dd className="break-all text-[#0b0b0b]">
                  {user.email ?? "Not available"}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#efece2] pb-2">
                <dt className="font-bold text-[#6b6b6b]">Name</dt>
                <dd className="text-[#0b0b0b]">{user.name ?? "—"}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="font-bold text-[#6b6b6b]">Account id</dt>
                <dd className="break-all font-mono text-xs text-[#0b0b0b]">
                  {user.id}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <SignOutButton />
              <Link
                href="/forgot-password"
                className="inline-flex h-11 items-center rounded-[4px] border-2 border-[#0b0b0b] px-4 text-sm font-bold shadow-[3px_3px_0px_0px_#0b0b0b]"
              >
                Change password
              </Link>
            </div>
          </Card>

          <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
            <h2 className="text-lg font-extrabold text-[#0b0b0b]">
              Stored transcripts
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3a3a3a]">
              Transcripts are kept for 30 days, then purged. Delete any job from
              the dashboard to remove its content immediately.
            </p>
            <div className="mt-4">
              <Badge variant="neutral">Retention: 30 days</Badge>
            </div>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-bold underline"
            >
              Manage stored jobs
            </Link>
          </Card>

          <Card className="border-[#d22b2b] p-5 hover:shadow-[6px_6px_0px_0px_#d22b2b]">
            <h2 className="text-lg font-extrabold text-[#d22b2b]">
              Delete account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3a3a3a]">
              This deletes your jobs, transcripts, credit balance and
              authentication record. It cannot be undone. If deletion fails after
              your data is removed, contact {SUPPORT_EMAIL}.
            </p>
            <div className="mt-4">
              <DeleteAccount />
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
