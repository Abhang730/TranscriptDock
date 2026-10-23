import { LEGAL_EFFECTIVE_DATE, SUPPORT_EMAIL } from "../brand";

export const OPERATOR = "TranscriptDock Operator (placeholder)";
export const OPERATOR_EMAIL = SUPPORT_EMAIL;
export const OPERATOR_ADDRESS = "Operator address not yet supplied (placeholder)";
export const LEGAL_EFFECTIVE = LEGAL_EFFECTIVE_DATE;

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };
