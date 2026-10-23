import { OPERATOR_EMAIL } from "./shared";

export const acceptableUse = {
  title: "Acceptable Use Policy",
  intro: `TranscriptDock is intended for legitimate transcription of videos whose captions you are entitled to access. This policy explains what we allow and what we prohibit so the service stays available to everyone.`,
  sections: [
    { heading: "What you may do", body: `You may use TranscriptDock to process videos you have a right to access, to retrieve available caption tracks, to preview transcripts, and to download transcripts you have obtained, within the limits of your account and the service.` },
    { heading: "What you must not do", body: `You must not use TranscriptDock to access content you are not authorized to access, to circumvent platform access controls, rate limits, or IP-based restrictions, to automate abuse of the service, to overload the backend with excessive requests, or to use the service for unlawful purposes, harassment, or infringement of someone else's rights.` },
    { heading: "Source authorization", body: `The default production provider must be an authorized or properly licensed caption retrieval source. We do not implement unauthorized scraping as the default production provider. If no suitable production provider is configured, the service will show a real unavailable state rather than silently proceeding without one.` },
    { heading: "Abuse control", body: `We may apply rate limiting, request timeouts, bounded job concurrency, maximum batch sizes, and other controls to keep the service reliable and to prevent abuse. We may restrict or block requests that appear abusive, automated beyond permitted limits, or directed at unsupported sources.` },
    { heading: "Language and caption availability", body: `Caption availability, language availability, and successful processing depend on the source and the configured provider. We do not guarantee that any particular video has captions or that a preferred language will be available.` },
    { heading: "Consequences of misuse", body: `If we believe your use violates this policy, we may suspend or limit your access, delete affected jobs or transcripts, or take other steps needed to protect the service. We may do this with or without notice, where appropriate.` },
    { heading: "Reporting problems", body: `If you see misuse of the service or a video source being processed without authorization, please contact us at ${OPERATOR_EMAIL}.` },
  ],
};
