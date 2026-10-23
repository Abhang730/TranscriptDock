import { OPERATOR_EMAIL } from "./shared";

export const refund = {
  title: "Refund and Cancellation Policy",
  intro: `This policy explains how refunds and cancellations work for the TranscriptDock one-time ₹49 support pack.`,
  sections: [
    { heading: "What the support pack is", body: `The TranscriptDock support pack is a one-time purchase priced at ₹49 INR. It is not a recurring subscription. It grants the entitlements configured for it, such as a defined number of transcript credits and a maximum batch size. Review the pricing page and Terms of Service for the current entitlement details.` },
    { heading: "When refunds may be available", body: `Refunds are evaluated case by case. A refund may be available if you purchased the support pack in error, if the payment was duplicated, or where a technical or processing issue prevented the pack from working as intended. If the pack was delivered and used as intended, a refund is not automatically guaranteed.` },
    { heading: "How to request a refund", body: `To request a refund, contact us at ${OPERATOR_EMAIL} with your name, email address, transaction details if you have them, and a brief description of the issue. The sooner you contact us after the issue, the easier it is to help.` },
    { heading: "Payment verification and duplicate prevention", body: `Credits are granted only after server-side payment verification. We verify Razorpay signatures and webhook signatures before granting entitlements, and we deduplicate webhook events so a payment cannot grant credits twice. If a payment is reversed, duplicated, or otherwise invalid, we may adjust entitlements accordingly.` },
    { heading: "Cancellation of the pack", body: `Because this is a one-time pack rather than an ongoing subscription, there is no monthly billing to cancel. If you no longer want the pack in the future, you can simply stop using its entitlement. Entitlements granted under the pack remain subject to these terms and the service limits.` },
    { heading: "Local requirements", body: `Indian payment, tax, and consumer-protection requirements may apply to your purchase. Where they apply, those requirements take precedence over this policy.` },
    { heading: "Support contact", body: `For refund requests or payment questions, email ${OPERATOR_EMAIL}.` },
  ],
};
