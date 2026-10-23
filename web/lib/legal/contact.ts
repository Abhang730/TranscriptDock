import { OPERATOR_EMAIL } from "./shared";

export const contact = {
  title: "Contact and Support",
  intro: `Use this page to get in touch with TranscriptDock support.`,
  sections: [
    { heading: "Before you contact us", body: `If you have a question about a transcription, check your recent jobs first. Many questions are answered by the processing status, the failed-items report, or the per-video status on a playlist job. If you are trying to use a video that has no captions, that is a source limitation rather than a TranscriptDock problem, and the service will tell you when captions are unavailable.` },
    { heading: "What to include", body: `When you contact support, please include the email address of the account the request relates to, a short description of the issue, the video or playlist URL if relevant, and any screenshot or error message that helps us understand the problem.` },
    { heading: "Account and account deletion", body: `You can manage account settings and request account deletion from your account settings. If you need help with account deletion, email us at ${OPERATOR_EMAIL}.` },
    { heading: "Press, business, and other enquiries", body: `For business enquiries, partnership questions, or other non-support messages, email ${OPERATOR_EMAIL}.` },
    { heading: "Response time", body: `We aim to respond to legitimate enquiries within a reasonable time, but we do not guarantee a specific response time. During high-demand periods, responses may take longer.` },
    { heading: "Remote-first operation", body: `TranscriptDock is operated remotely. There is no walk-in office. Please do not send physical mail unless a real business address has been provided elsewhere and requested by support.` },
  ],
};
