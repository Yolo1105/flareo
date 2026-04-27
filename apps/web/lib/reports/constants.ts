export const REPORT_CATEGORIES = [
  "broken",
  "malicious",
  "metadata",
  "legal",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATES = [
  "open",
  "investigating",
  "resolved",
  "dismissed",
] as const;

export type ReportState = (typeof REPORT_STATES)[number];

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  broken: "Module is broken or won't run",
  malicious: "Module contains malicious content",
  metadata: "Metadata or description is wrong",
  legal: "License, copyright, or legal concern",
  other: "Other issue",
};
