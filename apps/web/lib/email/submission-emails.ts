/**
 * Submission-related email senders.
 *
 * Reads RESEND_API_KEY and AUTH_RESEND_FROM at request time, not at
 * module init, so a deploy without Resend env set still boots — the
 * email just silently no-ops and logs a warning.
 *
 * React Email renders components to HTML; we send both the HTML and
 * a plain-text fallback to avoid spam filters that flag HTML-only
 * emails.
 */

import { render } from "@react-email/render";
import type { ReactElement } from "react";
import ApprovalEmail from "@/emails/ApprovalEmail";
import BuildSuccessEmail from "@/emails/BuildSuccessEmail";
import BuildFailedEmail from "@/emails/BuildFailedEmail";
import RejectionEmail from "@/emails/RejectionEmail";
import ChangesRequestedEmail from "@/emails/ChangesRequestedEmail";
import type { AdminSubmission } from "@/lib/db/admin-submissions";
import { appBaseUrl } from "@/lib/config/env";

// Lazy getters rather than module-scope constants so that importing
// this file in a test or a build step where NEXT_PUBLIC_APP_URL
// isn't set doesn't throw at import-time. The env read happens at
// first send attempt, by which point production env must be present.
function docsUrl(): string {
  return `${appBaseUrl()}/docs/submitting-dockerfiles`;
}

interface SendArgs {
  to: string;
  subject: string;
  react: ReactElement;
  // Plain-text alternative; rendered automatically from the React
  // tree if not provided but passing a hand-tuned version produces
  // much better plain-text emails.
  text?: string;
}

async function send({ to, subject, react, text }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM ?? "hello@flareo.dev";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping send", {
      to,
      subject,
    });
    return;
  }

  // Dynamic import so we don't pay the Resend SDK boot cost when not
  // actually sending. Next's server bundler is smart enough to tree-
  // shake this if no call path reaches here.
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const html = await render(react);
  const plain = text ?? (await render(react, { plainText: true }));

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: plain,
  });

  if (error) {
    // Surface via thrown error so the caller can log to Sentry.
    throw new Error(
      `[email] resend failed: ${error.name ?? "unknown"}: ${error.message ?? ""}`
    );
  }
}

/**
 * Best-effort resolution of the submitter's display name and email
 * for use in email templates. Falls back to contactEmail from flags
 * if the submitter isn't linked (legacy pre-migration rows).
 */
function resolveRecipient(submission: AdminSubmission): {
  email: string | null;
  name: string;
} {
  const email =
    submission.submitter?.email ?? submission.flags.contactEmail ?? null;
  const name =
    submission.submitter?.name ??
    (email ? email.split("@")[0] : "") ??
    "";
  return { email, name };
}

// ─── The 4 senders, one per decision path ───────────────────────────

export async function sendApprovalEmail(
  submission: AdminSubmission
): Promise<void> {
  const { email, name } = resolveRecipient(submission);
  if (!email) {
    console.warn("[email] no recipient for approval", {
      submissionId: submission.id,
    });
    return;
  }

  await send({
    to: email,
    subject: `Your Flareo submission has been approved`,
    react: ApprovalEmail({
      submitterName: name,
      slug: submission.moduleName,
      version: submission.version,
      submissionId: submission.id,
      // Link straight to the submission's own page — it has the live
      // build log, status banner, and eventually "View public page"
      // once the build lands. /app/modules wouldn't show this
      // submission until it's a built Module row.
      dashboardUrl: `${appBaseUrl()}/app/submissions/${submission.id}`,
    }),
  });
}

export async function sendBuildSuccessEmail(submission: {
  id: string;
  slug: string;
  submitterEmail: string;
  submitterName: string;
  digest: string;
  imageRef: string;
  signerIdentity: string;
  signerIssuer: string;
  rekorIndex: string;
  sbomUrl: string;
  // Optional policy fields. The worker passes them when the worker
  // version supports the admission-policy gate. Old worker versions
  // call without these, in which case `published` defaults to true
  // and the email renders the original "live in catalog" variant.
  policyVerdict?: "pass" | "warn" | "fail" | null;
  policyRevision?: number | null;
  policyHoldReason?: string | null;
  published?: boolean;
}): Promise<void> {
  const published = submission.published ?? true;
  const subject = published
    ? `Your Flareo module ${submission.slug} is live`
    : `Your Flareo module ${submission.slug} was built — held for review`;

  await send({
    to: submission.submitterEmail,
    subject,
    react: BuildSuccessEmail({
      submitterName: submission.submitterName,
      slug: submission.slug,
      digest: submission.digest,
      imageRef: submission.imageRef,
      signerIdentity: submission.signerIdentity,
      signerIssuer: submission.signerIssuer,
      rekorIndex: submission.rekorIndex,
      sbomUrl: submission.sbomUrl,
      catalogUrl: `${appBaseUrl()}/catalog/${submission.slug}`,
      published,
      policyVerdict: submission.policyVerdict ?? null,
      policyRevision: submission.policyRevision ?? null,
      policyHoldReason: submission.policyHoldReason ?? null,
    }),
  });
}

export async function sendBuildFailedEmail(
  submission: AdminSubmission,
  opts: { cveList?: string[] } = {}
): Promise<void> {
  const { email, name } = resolveRecipient(submission);
  if (!email) return;

  const errorKind =
    submission.buildErrorKind === "system"
      ? "system"
      : submission.buildErrorKind === "scan"
      ? "scan"
      : "user";

  await send({
    to: email,
    subject: `Your Flareo build failed: ${submission.moduleName}`,
    react: BuildFailedEmail({
      submitterName: name,
      slug: submission.moduleName,
      submissionId: submission.id,
      errorKind,
      errorMessage: submission.buildErrorMessage ?? "Build failed without a message.",
      buildLogUrl: submission.buildLogUrl,
      cveList: opts.cveList,
      docsUrl: docsUrl(),
    }),
  });
}

export async function sendRejectionEmail(
  submission: AdminSubmission,
  reason: string
): Promise<void> {
  const { email, name } = resolveRecipient(submission);
  if (!email) return;

  await send({
    to: email,
    subject: `Update on your Flareo submission: ${submission.moduleName}`,
    react: RejectionEmail({
      submitterName: name,
      slug: submission.moduleName,
      submissionId: submission.id,
      reason,
      docsUrl: docsUrl(),
    }),
  });
}

export async function sendChangesRequestedEmail(
  submission: AdminSubmission,
  message: string
): Promise<void> {
  const { email, name } = resolveRecipient(submission);
  if (!email) return;

  await send({
    to: email,
    subject: `Changes requested on your Flareo submission: ${submission.moduleName}`,
    react: ChangesRequestedEmail({
      submitterName: name,
      slug: submission.moduleName,
      submissionId: submission.id,
      message,
      // Deep-link into the submission — "changes requested" is the
      // state where deep-linking matters most. The user opens the
      // email, sees the feedback, clicks through to the page with
      // the original manifest + log + reviewer note in one place.
      dashboardUrl: `${appBaseUrl()}/app/submissions/${submission.id}`,
    }),
  });
}
