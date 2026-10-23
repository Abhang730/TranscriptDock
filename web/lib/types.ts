/** Shared types that mirror the backend API contracts. */

export type TranscriptLanguage = "auto" | "en" | "hi" | "mr";

export type TranscriptFormatId = "txt" | "csv" | "srt" | "vtt";

export type JobMode = "single" | "playlist";

export type JobStatus =
  | "pending"
  | "processing"
  | "partial"
  | "completed"
  | "failed"
  | "cancelled";

export type ItemStatus = "pending" | "processing" | "success" | "failed";

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface Transcript {
  id: string;
  itemId: string | null;
  title: string;
  sourceUrl: string;
  videoId: string;
  language: string | null;
  provider: string;
  isDemo: boolean;
  text: string;
  segments: TranscriptSegment[];
  segmentCount: number;
  isTimestamped: boolean;
  createdAt: string;
}

export interface JobItem {
  id: string;
  position: number;
  title: string;
  sourceUrl: string;
  videoId: string;
  status: ItemStatus;
  transcript: Transcript | null;
  errorMessage: string | null;
  retryCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TranscriptJob {
  id: string;
  mode: JobMode;
  sourceUrl: string;
  status: JobStatus;
  language: string;
  totalItems: number;
  succeededItems: number;
  failedItems: number;
  playlistTitle: string | null;
  errorMessage: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  items: JobItem[];
}

export interface JobListResponse {
  jobs: TranscriptJob[];
}

export interface CreditBalance {
  balance: number;
  packHeld: boolean;
  purchasedAt: string | null;
  freeCreditsGranted: number;
}

export interface PaymentRecord {
  id: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  creditsGranted: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListResponse {
  payments: PaymentRecord[];
}

export interface CreateOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  credits: number;
  packPriceInr: number;
}

export interface PlaylistEntry {
  videoId: string;
  title: string;
  sourceUrl: string;
  durationSeconds: number | null;
}

export interface PlaylistPreview {
  playlistId: string;
  title: string;
  entries: PlaylistEntry[];
  provider: string;
  isDemo: boolean;
}

export interface PublicConfig {
  demoMode: boolean;
  provider: string;
  paymentsEnabled: boolean;
  supportedLanguages: string[];
  freeBatchSize: number;
  paidBatchSize: number;
  packPricePaise: number;
  packCredits: number;
  freeCredits: number;
  anonymousSingleAllowed: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}
