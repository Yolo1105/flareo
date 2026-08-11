/**
 * Core domain types for the Flareo marketing + docs site.
 * When swapping mock data to a real API, these stay stable.
 */

export type ModuleCategory =
  | "security"
  | "proxy"
  | "monitoring"
  | "auth"
  | "devops"
  | "media";

export type VerificationStatus = "verified" | "pending" | "failing";

export type SlsaLevel = "L1" | "L2" | "L3" | "L4";

export interface Module {
  /** Sequential Flareo ID, e.g. "FLA-2026-0001" */
  id: string;
  /** URL slug */
  slug: string;
  /** Display name (uppercase, used in H2s) */
  name: string;
  /** Version pinned at publication */
  version: string;
  /** Upstream author / maintainer */
  author: string;
  /** One-line description */
  description: string;
  /** Tags shown in catalog row */
  tags: readonly string[];
  /** Category for filtering */
  category: ModuleCategory;
  /** Verification stamp state */
  status: VerificationStatus;
  /**
   * Deprecated SLSA level field. Always null for new writes — the
   * pipeline does not claim an SLSA build level. Kept optional for
   * rows that still carry a legacy value.
   */
  slsa: SlsaLevel | null;
  /** Trust score 0-100 */
  trust: number;
  /** Trust breakdown — equal-weight 0–100 signals; trust is their mean */
  trustBreakdown: {
    /** Vulnerability posture — 0–100 */
    vulns: number;
    /** Provenance (Rekor + upstream digest) — 0–100; DB column trustSlsa */
    provenance: number;
    /** Signature chain — 0–100 */
    signature: number;
    /** SBOM completeness — 0–100 */
    sbom: number;
  };
  /** CVE counts at scan time */
  cves: { critical: number; high: number; medium: number; low: number };
  /** Total deploys so far */
  deploys: number;
  /** Hours since last rebuild */
  updatedHours: number;
  /** Image size, e.g. "62 MB" */
  size: string;
  /** sha256 digest of the signed image */
  digest: string;
  /** Whether this module supports live preview in a sandbox VM */
  previewable: boolean;
  /** Public catalog entry or private to the publisher */
  visibility: "public" | "private";
  /** Registry pulls in the last 30 days */
  pulls30d: number;
  /** True while a build is currently in flight for this module */
  building: boolean;
  /**
   * ISO timestamp of the most recent successful canary rebuild (or
   * upstream-unchanged no-op). Null until the first rebuild lands.
   * Failed rebuilds do NOT advance this — last-SUCCESSFUL is the
   * useful signal, not last-ATTEMPTED.
   */
  lastRebuiltAt?: string | null;
  /**
   * Public @handle of the publisher, when one exists. Used to turn
   * the "by NAME" line in the module hero into a link to the public
   * profile. Null for modules whose publisher deleted their account
   * or predates the username migration.
   */
  publisherUsername?: string | null;
}

export interface BuildStage {
  /** Stage order, 01-06 */
  order: string;
  /** Stage short name — submit, build, scan, attest, sign, publish */
  name: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Output hash fragment */
  hashFragment: string;
}

export interface Build {
  /** Build number, e.g. "#0847" */
  id: string;
  /** Module slug this build belongs to */
  moduleSlug: string;
  /** ISO timestamp of start */
  startedAt: string;
  /** Stage-by-stage breakdown */
  stages: readonly BuildStage[];
  /** Git commit SHA that was built from */
  sourceCommit: string;
}

export interface Incident {
  id: string;
  title: string;
  /** ISO timestamp of detection */
  detectedAt: string;
  /** Seconds from detect to resolve */
  durationSec: number;
  status: "resolved" | "ongoing" | "investigating";
  /** Human-readable body paragraph */
  body: string;
  /** Timeline of events during the incident */
  timeline: readonly {
    ts: string; // "HH:MM:SS UTC"
    tag: "DETECT" | "INVESTIGATE" | "MITIGATE" | "VERIFY" | "RESOLVE";
    message: string;
  }[];
}

export interface NavLink {
  num: string; // "01", "02", ...
  label: string;
  href: string;
  /** When true, renders as <a target="_blank">. For off-site links. */
  external?: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface AdrRecord {
  /** "ADR-001" */
  id: string;
  /** One-line decision title */
  question: string;
  /** ISO date */
  decidedOn: string;
  /** Reasoning paragraph (may contain HTML-safe markup tokens) */
  reasoning: string;
  /** Trade-off accepted */
  tradeoff: string;
}

export interface ConceptEntry {
  /** Display term, e.g. "SBOM" */
  term: string;
  /** IPA-ish pronunciation guide, e.g. "/S-bomb/" */
  pronunciation: string;
  /** Category label, e.g. "inventory doc" */
  category: string;
  /** Bold one-line definition */
  oneLiner: string;
  /** Full explanation — React children */
  body: React.ReactNode;
  /** External spec link */
  specUrl: string;
  /** Makes the card span the full grid width (used for provenance) */
  solo?: boolean;
}

export interface PipelineStage {
  num: string; // "01"..."06"
  tag: string; // "SUBMIT", "BUILD", ...
  name: string; // two-word stack like "SOURCE / IN"
  nameLines: readonly [string, string];
  terms: readonly string[];
}

/* ───────────────────────────────────────────────────────────────────────────
 * Authenticated app types — added for /app surface
 * ─────────────────────────────────────────────────────────────────────────── */

export type ChangelogKind = "feature" | "fix" | "breaking" | "security";

export interface ChangelogEntry {
  /** Semver version, e.g. "0.4.2" */
  version: string;
  /** ISO date, e.g. "2026-04-18" */
  date: string;
  /** Short title, e.g. "Provenance attestation format update" */
  title: string;
  /** Two-sentence summary */
  summary: string;
  /** List of itemized changes */
  changes: readonly {
    kind: ChangelogKind;
    text: string;
  }[];
}

export interface ApiKey {
  id: string;
  /** Human-readable label */
  label: string;
  /** Masked for display: "fla_••••••••abc1" */
  maskedToken: string;
  createdAt: string;
  /** ISO date of last use, or null if never used */
  lastUsedAt: string | null;
  /** Scope — which commands this key allows */
  scopes: readonly string[];
}

export type NotificationKind = "build_done" | "build_failed" | "mention" | "security";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO timestamp */
  at: string;
  read: boolean;
  /** Optional href to navigate to */
  href?: string;
}

export type JobStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export interface Job {
  id: string;
  moduleSlug: string;
  moduleName: string;
  version: string;
  status: JobStatus;
  /** ISO timestamp of job start */
  startedAt: string;
  /** Current stage index, 0-5 (-1 if queued) */
  currentStage: number;
  /** Overall progress 0-100 */
  percent: number;
  /** Per-stage completion — one entry per stage */
  stages: readonly {
    name: string;
    status: JobStatus;
    durationMs: number | null;
  }[];
}

export interface MyModule extends Module {
  /** Whether this module is publicly listed or private */
  visibility: "public" | "private";
  /** How many pulls this module received in the last 30 days */
  pulls30d: number;
  /** Whether this module has a live rebuild running now */
  building: boolean;
}
