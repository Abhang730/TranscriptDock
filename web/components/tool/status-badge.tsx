import { Badge } from "@/components/ui/badge";
import type { ItemStatus, JobStatus } from "@/lib/types";

const JOB_LABELS: Record<JobStatus, string> = {
  pending: "Queued",
  processing: "Processing",
  partial: "Partial success",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const ITEM_LABELS: Record<ItemStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  success: "Done",
  failed: "Failed",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const variant =
    status === "completed"
      ? "accent"
      : status === "partial"
        ? "neutral"
        : status === "failed"
          ? "danger"
          : status === "processing"
            ? "blue"
            : "muted";

  return <Badge variant={variant}>{JOB_LABELS[status]}</Badge>;
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const variant =
    status === "success"
      ? "accent"
      : status === "failed"
        ? "danger"
        : status === "processing"
          ? "blue"
          : "muted";

  return <Badge variant={variant}>{ITEM_LABELS[status]}</Badge>;
}
