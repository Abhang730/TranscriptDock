import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  ListVideo,
  Settings,
  Video,
} from "lucide-react";
import { SiteHeader, Footer } from "@/components/web";
import { JobStatusBadge } from "@/components/tool/status-badge";
import { DeleteJobButton } from "@/components/tool/delete-job-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { callBackend } from "@/lib/backend";
import { formatDate, formatPaise, truncate } from "@/lib/format";
import { getSessionUser } from "@/lib/supabase/server";
import type {
  CreditBalance,
  JobListResponse,
  PaymentListResponse,
} from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const { response, body } = await callBackend(path);
    if (!response.ok || !body) return null;
    return body as T;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=%2Fdashboard");

  const [jobs, credits, payments] = await Promise.all([
    safeJson<JobListResponse>("/jobs"),
    safeJson<CreditBalance>("/credits"),
    safeJson<PaymentListResponse>("/payments"),
  ]);

  const backendDown = jobs === null && credits === null;
  const recentJobs = jobs?.jobs.slice(0, 8) ?? [];

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b-2 border-[#0b0b0b] bg-[#efece2] px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b]">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-4xl">
                Welcome back{user.name ? `, ${user.name}` : ""}
              </h1>
              <p className="mt-2 text-sm text-[#3a3a3a]">
                Signed in as {user.email ?? "your account"}. You can only see your
                own jobs and transcripts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="accent">
                <Link href="/single">
                  <Video size={16} strokeWidth={3} aria-hidden />
                  New single video
                </Link>
              </Button>
              <Button asChild variant="blue">
                <Link href="/playlist">
                  <ListVideo size={16} strokeWidth={3} aria-hidden />
                  New playlist
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
          {backendDown ? (
            <Alert variant="danger">
              <div>
                <AlertTitle>Processing service unavailable</AlertTitle>
                <AlertDescription>
                  Your account is signed in, but the FastAPI backend could not be
                  reached, so job history and credits cannot be loaded. Start the
                  API server (<code>uvicorn app.main:app</code> in{" "}
                  <code>api/</code>) and reload.
                </AlertDescription>
              </div>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#6b6b6b]">
                Credits
              </p>
              <p className="mt-2 text-4xl font-extrabold text-[#0b0b0b]">
                {credits ? credits.balance : "—"}
              </p>
              <p className="mt-1 text-xs text-[#6b6b6b]">
                {credits?.packHeld
                  ? "Support pack active"
                  : "One credit per successful transcript"}
              </p>
            </Card>

            <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#6b6b6b]">
                Jobs
              </p>
              <p className="mt-2 text-4xl font-extrabold text-[#0b0b0b]">
                {jobs ? jobs.jobs.length : "—"}
              </p>
              <p className="mt-1 text-xs text-[#6b6b6b]">
                Stored processing jobs
              </p>
            </Card>

            <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#6b6b6b]">
                Support pack
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#0b0b0b]">
                {credits?.packHeld ? "Active" : "Not purchased"}
              </p>
              <Link
                href="/pricing#support-pack"
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline"
              >
                View pack
                <ArrowRight size={12} strokeWidth={3} aria-hidden />
              </Link>
            </Card>

            <Card className="p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#6b6b6b]">
                Account
              </p>
              <p className="mt-2 truncate text-sm font-bold text-[#0b0b0b]">
                {user.email}
              </p>
              <Link
                href="/settings"
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline"
              >
                <Settings size={12} strokeWidth={3} aria-hidden />
                Manage settings
              </Link>
            </Card>
          </div>

          <section aria-labelledby="recent-jobs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2
                id="recent-jobs"
                className="text-xl font-extrabold tracking-[-0.01em] text-[#0b0b0b]"
              >
                Recent jobs
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#6b6b6b]">
                Only your own records are returned
              </p>
            </div>

            {recentJobs.length === 0 ? (
              <Card className="p-6 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
                <p className="font-bold text-[#0b0b0b]">No jobs yet</p>
                <p className="mt-1 text-sm text-[#6b6b6b]">
                  Start with a single video or open a playlist to see it here.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="accent" size="sm">
                    <Link href="/single">Try a single video</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/playlist">Open a playlist</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentJobs.map((job) => {
                  const title =
                    job.playlistTitle ??
                    job.items[0]?.title ??
                    truncate(job.sourceUrl, 60);
                  return (
                    <li key={job.id}>
                      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="neutral">
                              {job.mode === "single" ? "Single" : "Playlist"}
                            </Badge>
                            <JobStatusBadge status={job.status} />
                            {job.isDemo ? (
                              <Badge variant="muted">Demo</Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 truncate font-bold text-[#0b0b0b]">
                            {title}
                          </p>
                          <p className="mt-1 text-xs text-[#6b6b6b]">
                            {formatDate(job.createdAt)} · {job.succeededItems} done
                            · {job.failedItems} failed · {job.totalItems} total
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/jobs/${job.id}`}>
                              Open
                              <ArrowRight size={14} strokeWidth={3} aria-hidden />
                            </Link>
                          </Button>
                          <DeleteJobButton jobId={job.id} />
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="payments">
            <h2
              id="payments"
              className="mb-3 text-xl font-extrabold tracking-[-0.01em] text-[#0b0b0b]"
            >
              Support pack history
            </h2>
            {payments && payments.payments.length > 0 ? (
              <Card className="overflow-x-auto p-0 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b-2 border-[#0b0b0b] bg-[#efece2]">
                    <tr>
                      <th className="px-4 py-2 font-extrabold">Date</th>
                      <th className="px-4 py-2 font-extrabold">Amount</th>
                      <th className="px-4 py-2 font-extrabold">Status</th>
                      <th className="px-4 py-2 font-extrabold">Credits</th>
                      <th className="px-4 py-2 font-extrabold">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-[#efece2] last:border-0"
                      >
                        <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                        <td className="px-4 py-2">
                          {formatPaise(payment.amountPaise)}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={
                              payment.status === "paid" ? "accent" : "muted"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">{payment.creditsGranted}</td>
                        <td className="max-w-[180px] truncate px-4 py-2 font-mono text-xs">
                          {payment.providerPaymentId ?? payment.providerOrderId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5 hover:shadow-[6px_6px_0px_0px_#0b0b0b]">
                <div>
                  <p className="font-bold text-[#0b0b0b]">No payments yet</p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    The ₹49 support pack is a one-time purchase and grants{" "}
                    50 credits when checkout is enabled.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/pricing#support-pack">
                    <CreditCard size={14} strokeWidth={3} aria-hidden />
                    View pack
                  </Link>
                </Button>
              </Card>
            )}
          </section>

          <p className="text-xs leading-relaxed text-[#6b6b6b]">
            Retention: transcripts are stored for {30} days by default and can be
            deleted sooner from this dashboard or from account settings. Deleting
            a job removes its transcript content immediately.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
