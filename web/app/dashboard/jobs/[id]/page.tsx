import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { SiteHeader, Footer } from "@/components/web";
import { ItemStatusBadge, JobStatusBadge } from "@/components/tool/status-badge";
import { DeleteJobButton } from "@/components/tool/delete-job-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { callBackend } from "@/lib/backend";
import { formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/supabase/server";
import type { TranscriptJob } from "@/lib/types";

export const metadata: Metadata = { title: "Job detail" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/dashboard/jobs/${id}`)}`);

  const result = await callBackend(`/jobs/${id}`).catch(() => null);

  if (!result) {
    return (
      <Shell>
        <Alert variant="danger">
          <div>
            <AlertTitle>Processing service unavailable</AlertTitle>
            <AlertDescription>
              The job could not be loaded because the FastAPI backend is not
              reachable.
            </AlertDescription>
          </div>
        </Alert>
      </Shell>
    );
  }

  if (result.response.status === 404) notFound();
  if (result.response.status === 401 || result.response.status === 403) {
    return (
      <Shell>
        <Alert variant="danger">
          <div>
            <AlertTitle>Not available</AlertTitle>
            <AlertDescription>
              This job does not belong to your account, or it has been deleted.
            </AlertDescription>
          </div>
        </Alert>
      </Shell>
    );
  }

  if (!result.response.ok || !result.body) {
    return (
      <Shell>
        <Alert variant="danger">
          <div>
            <AlertTitle>Could not load the job</AlertTitle>
            <AlertDescription>
              The service returned an unexpected response. Try again shortly.
            </AlertDescription>
          </div>
        </Alert>
      </Shell>
    );
  }

  const job = result.body as TranscriptJob;

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              {job.mode === "single" ? "Single video" : "Playlist"}
            </Badge>
            <JobStatusBadge status={job.status} />
            {job.isDemo ? <Badge variant="muted">Demo provider</Badge> : null}
            <Badge variant="neutral">{job.language}</Badge>
          </div>
          <h1 className="mt-3 break-words text-2xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] sm:text-3xl">
            {job.playlistTitle ?? job.items[0]?.title ?? "Transcript job"}
          </h1>
          <p className="mt-2 break-all text-xs text-[#6b6b6b]">
            {job.sourceUrl} · created {formatDate(job.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {job.succeededItems > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <a href={`/api/jobs/${job.id}/export?format=txt`}>
                <Download size={14} strokeWidth={3} aria-hidden />
                Combined TXT
              </a>
            </Button>
          ) : null}
          {job.succeededItems > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <a href={`/api/jobs/${job.id}/export?format=zip`}>
                <Download size={14} strokeWidth={3} aria-hidden />
                ZIP
              </a>
            </Button>
          ) : null}
          <DeleteJobButton jobId={job.id} redirectTo="/dashboard" />
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-4">
        {job.items.map((item) => (
          <li key={item.id}>
            <Card className="p-4 hover:shadow-[6px_6px_0px_0px_#0b0b0b] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#0b0b0b]">
                    {String(item.position).padStart(2, "0")}. {item.title}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#6b6b6b]">
                    {item.sourceUrl}
                  </p>
                  {item.errorMessage ? (
                    <p className="mt-2 text-xs font-bold text-[#d22b2b]">
                      {item.errorMessage}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ItemStatusBadge status={item.status} />
                  {item.transcript ? (
                    <>
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={`/api/jobs/${job.id}/items/${item.id}/export?format=txt`}
                        >
                          TXT
                        </a>
                      </Button>
                      {item.transcript.isTimestamped ? (
                        <>
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={`/api/jobs/${job.id}/items/${item.id}/export?format=srt`}
                            >
                              SRT
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={`/api/jobs/${job.id}/items/${item.id}/export?format=vtt`}
                            >
                              VTT
                            </a>
                          </Button>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              {item.transcript ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="accent">{item.transcript.segmentCount} segments</Badge>
                    <Badge variant="neutral">
                      {item.transcript.language ?? "auto"}
                    </Badge>
                    <Badge variant={item.transcript.isDemo ? "muted" : "blue"}>
                      {item.transcript.isDemo ? "Demo data" : "Provider data"}
                    </Badge>
                  </div>
                  <details className="mt-3 rounded-[4px] border-2 border-[#0b0b0b]">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-bold">
                      View transcript text
                    </summary>
                    <pre className="max-h-[420px] overflow-auto border-t-2 border-[#0b0b0b] p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {item.transcript.text}
                    </pre>
                  </details>
                </>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-[#6b6b6b]">
        Jobs and transcripts are scoped to your account in both the API and the
        database policies. Deleting this job removes its transcript content.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
          <Link
            href="/dashboard"
            className="mb-6 inline-block rounded-sm text-xs font-bold uppercase tracking-[0.04em] underline"
          >
            ← Back to dashboard
          </Link>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
