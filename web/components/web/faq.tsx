import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SUPPORT_PACK, FREE_TIER } from "@/lib/brand";

const FAQ_DATA = [
  {
    q: "What video sources does TranscriptDock support?",
    a: "The product is built around YouTube video and playlist links. This build uses a clearly labelled demo provider, so it does not access YouTube. In production, the backend uses an authorized transcript provider and will only process sources that provider is permitted to handle.",
  },
  {
    q: "Which languages are available?",
    a: `The UI supports Auto, English, Hindi, and Marathi. If your selected language is available for a video, the transcript uses it. If not, it falls back to the first available caption track. Availability depends on what the video actually has and what your configured provider can access.`,
  },
  {
    q: "What happens when a video has no captions?",
    a: "You get a clear in-product message that captions were unavailable, inaccessible, or unsupported. We do not manufacture a transcript to make a failed operation look successful. For playlists, failed videos are listed in a failed-items report so you can retry or skip them.",
  },
  {
    q: "How long does processing take?",
    a: "A single video is usually fast when captions are available. Playlists are processed as bounded batches using asynchronous jobs, so a large playlist does not keep your browser request open. You can poll or follow job status from the dashboard.",
  },
  {
    q: "Which download formats are available?",
    a: "TXT is available for any transcript we return. SRT and VTT are available when the data includes timestamps. CSV is available when a row-based export makes sense for the returned transcript structure.",
  },
  {
    q: "Is there a free tier?",
    a: `Yes. The free experience includes single-video and playlist transcription in demo mode, language selection, and the same download formats. Free users are limited to a smaller batch size, currently up to ${FREE_TIER.maxVideosPerBatch} videos per batch. The demo uses sample data until a real provider is configured.`,
  },
  {
    q: "What is the ₹49 support pack?",
    a: `It is a one-time ₹49 INR purchase that gives you a larger processing allowance, including ${SUPPORT_PACK.credits} transcript credits and a higher per-batch limit of up to ${SUPPORT_PACK.maxVideosPerBatch} videos. It does not renew. The exact entitlements are configurable server-side, and production checkout stays disabled until they are configured.`,
  },
  {
    q: "How is payment handled?",
    a: "Payments use Razorpay via a server-side order flow. The backend verifies Razorpay signatures and webhook signatures before granting entitlements, deduplicates webhook events, and stores payment identifiers and verified status. Sensitive payment credentials are not stored by us.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds are handled under the Refund and Cancellation Policy. Because the pack is a small one-time purchase, please contact support through the Contact page if you believe a refund is appropriate. Refund eligibility is reviewed case by case.",
  },
  {
    q: "How is my data handled?",
    a: "Your account, jobs, and transcripts are private to your authenticated account. We use Row Level Security in the database so you can only access your own records. Server-only operations, payment verification, and credit changes are enforced on the backend. See the Privacy Policy for the full explanation.",
  },
  {
    q: "Do you store my transcripts forever?",
    a: "No. We apply a documented retention policy and let you delete stored transcripts and job history from your account. We do not retain transcript content indefinitely without a clear reason, and we do not publish transcripts on a public index.",
  },
  {
    q: "Is TranscriptDock affiliated with YouTube or Google?",
    a: "No. TranscriptDock is a separate product. It is not affiliated with or endorsed by YouTube, Google, Supabase, Razorpay, or any other third party mentioned. Where we reference YouTube or Google, we do so because the product depends on them as external services, not because we are part of them.",
  },
];

export function FAQ() {
  return (
    <section className="border-t-2 border-[#0b0b0b] bg-[#f6f4ec] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6b6b6b]">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#0b0b0b] mt-3">
            Common questions
          </h2>
        </div>

        <Accordion defaultValue="q-what-video-sources">
          {FAQ_DATA.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
