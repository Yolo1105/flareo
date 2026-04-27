/**
 * Billing quota + plan helpers.
 *
 * Source of truth for the two decisions that gate paid-tier features:
 *
 *   1. "What plan is this user on?" — read once from the DB, cached in
 *      the request lifecycle; callers should not hit prisma.user.plan
 *      directly because upcoming changes (e.g. team-plan lookups,
 *      trial-period overrides) will add complexity here and nowhere
 *      else.
 *   2. "Can this user submit another module?" — combines the plan's
 *      public-module quota with the user's current catalog count plus
 *      their in-flight submissions.
 *
 * Stripe integration (checkout, customer portal, webhooks) is
 * deferred to a later session; the schema columns and this module's
 * upgradeUserPlan / downgradeUserPlan helpers are the seams those
 * integrations plug into. Today, every user is on "free".
 *
 * The rate-limit buckets defined in lib/ratelimit/index.ts are
 * plan-agnostic for now. Wiring plan-aware bucket selection (pro
 * users get higher limits) is out of scope for this session; the
 * `rateLimitMultiplier` field on PLAN_LIMITS is present so the
 * wiring can land later without a schema change.
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * A subset of the Prisma client this module needs. Lets callers pass
 * either the global `prisma` or a transaction handle so quota checks
 * can be bundled into larger atomic writes.
 */
type QuotaDb = Pick<
  PrismaClient | Prisma.TransactionClient,
  "user" | "module" | "submission"
>;

// ─── plan definitions ──────────────────────────────────────────────
//
// Plan limits + price labels live in lib/billing/plans.ts (pure data,
// no DB imports) so client components can reference them. We re-export
// from here so existing server-side import paths stay stable.

export {
  PLAN_LIMITS,
  type PlanKey,
  type PlanLimits,
} from "./plans";
import { PLAN_LIMITS } from "./plans";
import type { PlanKey } from "./plans";

export const DEFAULT_PLAN: PlanKey = "free";

// ─── plan lookup ───────────────────────────────────────────────────

/**
 * Resolve the user's current plan key. Defaults to "free" if the
 * column holds an unexpected value; callers never see an invalid
 * plan string from this function.
 *
 * Cast through `as` because the Prisma client in the sandbox may
 * lag the schema; at runtime the column always exists after
 * migrate deploy.
 */
export async function getUserPlan(
  userId: string,
  db: QuotaDb = prisma,
): Promise<PlanKey> {
  const row = (await db.user.findUnique({
    where: { id: userId },
    select: { plan: true } as never,
  })) as { plan?: string | null } | null;

  const raw = row?.plan ?? DEFAULT_PLAN;
  if (raw === "free" || raw === "pro") return raw;
  return DEFAULT_PLAN;
}

export type Visibility = "public" | "private";

export interface ModuleUsage {
  /** Published modules (in this visibility bucket) the user currently owns. */
  published: number;
  /** Pending / approved / building submissions targeting this visibility. */
  inFlight: number;
  /** Sum of the two; compared against the plan's matching cap. */
  used: number;
  /** The plan's limit for this bucket, or null if unlimited. */
  limit: number | null;
  /** How many more modules in this bucket the user can submit right now. */
  remaining: number | null;
  /** Which bucket this usage is for. */
  visibility: Visibility;
}

/**
 * Back-compat alias — old code imported `PublicModuleUsage`. New
 * callers should use `ModuleUsage`. Removable once all callers are
 * migrated.
 */
export type PublicModuleUsage = ModuleUsage;

/**
 * Compute current module usage for the user in a given visibility
 * bucket. Pure read; no side effects. Safe to call from any request
 * path. Accepts an optional `db` handle so the caller can share a
 * transaction with a subsequent write.
 *
 * `published` counts Module rows (rows where the pipeline completed).
 * `inFlight` counts Submission rows in non-terminal states that are
 * targeting this visibility. Both are added to form `used`, compared
 * against the plan's matching cap.
 *
 * Returns limit=null for "unlimited"; remaining=null follows.
 */
export async function getModuleUsage(
  userId: string,
  visibility: Visibility,
  db: QuotaDb = prisma,
): Promise<ModuleUsage> {
  const plan = await getUserPlan(userId, db);
  const planLimit =
    visibility === "public"
      ? PLAN_LIMITS[plan].maxConcurrentPublicModules
      : PLAN_LIMITS[plan].maxConcurrentPrivateModules;
  const limit = planLimit === "unlimited" ? null : planLimit;

  const [published, inFlight] = await Promise.all([
    db.module.count({
      where: {
        publisherId: userId,
        visibility,
      } as never,
    }),
    db.submission.count({
      where: {
        submitterId: userId,
        visibility,
        status: { in: ["pending", "approved", "building"] },
      } as never,
    }),
  ]);

  const used = published + inFlight;
  const remaining = limit === null ? null : Math.max(0, limit - used);

  return { published, inFlight, used, limit, remaining, visibility };
}

/**
 * Back-compat alias. Existing callers (admin analytics, billing page)
 * only care about public usage; this preserves their shape.
 */
export async function getPublicModuleUsage(
  userId: string,
  db: QuotaDb = prisma,
): Promise<ModuleUsage> {
  return getModuleUsage(userId, "public", db);
}

export interface CanSubmitResult {
  allowed: boolean;
  /**
   * Machine-readable reason when `allowed=false`:
   *   - "quota_exceeded"         — user is on the right plan but has
   *                                 hit the cap for this visibility.
   *                                 Resolution: cancel an in-flight
   *                                 submission, or upgrade plan.
   *   - "plan_requires_upgrade"  — user's plan disallows this
   *                                 visibility at any level (e.g. free
   *                                 user trying to submit private).
   *                                 Resolution: upgrade to pro.
   */
  reason?: "quota_exceeded" | "plan_requires_upgrade";
  /** Human-readable message suitable for display in API error responses. */
  message?: string;
  /** Always populated — UI uses this to render usage meters. */
  usage: ModuleUsage;
  /** The plan key, for convenience. */
  plan: PlanKey;
}

/**
 * Decide whether this user is allowed to create a new submission with
 * the given visibility. Called from /api/v1/submissions POST before
 * the DB insert. Returns a structured result rather than throwing so
 * the API layer can shape the response consistently.
 *
 * Two distinct failure modes get different reason codes:
 *
 *   1. Plan disallows the visibility entirely. Free users have a
 *      private-module cap of 0 — they can't submit private at all.
 *      The UI should render this as "upgrade to pro", not "you've
 *      hit your cap", because that's an accurate representation of
 *      the situation.
 *
 *   2. Plan allows it but the user is at their concurrent cap.
 *      UI should render this as "cancel something in-flight, or
 *      upgrade" (for free) / "cancel something in-flight" (for pro).
 *
 * IMPORTANT — TOCTOU: this function's return value is only trustworthy
 * for the moment it was computed. The caller should run canSubmit AND
 * the submission.create in the SAME transaction, passing the `tx`
 * handle to both, so a concurrent request from the same user can't
 * slip through the cap. `/api/v1/submissions` does exactly that.
 */
export async function canSubmit(
  userId: string,
  visibility: Visibility = "public",
  db: QuotaDb = prisma,
): Promise<CanSubmitResult> {
  const plan = await getUserPlan(userId, db);
  const usage = await getModuleUsage(userId, visibility, db);

  // Plan flat-out doesn't allow this visibility (cap of 0).
  if (usage.limit === 0) {
    return {
      allowed: false,
      reason: "plan_requires_upgrade",
      message:
        visibility === "private"
          ? `Private modules are a Pro feature. Upgrade to Pro (${PLAN_LIMITS.pro.priceLabel}) to submit private modules.`
          : "This plan doesn't allow public modules. Contact support.",
      usage,
      plan,
    };
  }

  // Plan allows it but the user is at the cap.
  if (usage.limit !== null && usage.used >= usage.limit) {
    const kindLabel = visibility === "public" ? "public" : "private";
    return {
      allowed: false,
      reason: "quota_exceeded",
      message: `You have ${usage.used} ${kindLabel} module${usage.used === 1 ? "" : "s"} (limit: ${usage.limit} on the ${plan} plan). Finish or reject an in-flight submission${plan === "free" ? ", or upgrade to Pro" : ""}.`,
      usage,
      plan,
    };
  }

  return { allowed: true, usage, plan };
}

// ─── plan writes — used by Stripe webhooks ─────────────────────────

/**
 * Result of an upgrade call. Distinguishes the three interesting cases:
 *
 *   "upgraded"           — user went from free to pro, fresh. Normal
 *                          happy path.
 *   "already_current"    — user was already on pro with exactly these
 *                          Stripe IDs. Duplicate webhook delivery;
 *                          benign no-op.
 *   "replaced"           — user was already on pro with DIFFERENT
 *                          Stripe IDs (an earlier subscription).
 *                          This is an orphan situation — the old
 *                          subscription should be cancelled in Stripe
 *                          to stop double-charging. The caller
 *                          (webhook) is responsible for doing that.
 *
 * Returning this discriminated result (instead of just writing and
 * walking away) lets the webhook handler do the right thing on
 * replacement: cancel the stale sub via the Stripe API, log loudly,
 * surface to Sentry.
 */
export type UpgradeResult =
  | { status: "upgraded" }
  | { status: "already_current" }
  | {
      status: "replaced";
      previousStripeCustomerId: string | null;
      previousStripeSubscriptionId: string | null;
    };

/**
 * Set a user's plan to "pro" and record the Stripe linkage. Called
 * from the checkout-completed webhook.
 *
 * Idempotent against identical re-runs (duplicate webhook deliveries
 * land as `already_current`), and transparent about replacement of
 * an existing subscription so the caller can cancel the stale one
 * in Stripe. The read-then-write is run in a transaction so two
 * concurrent webhook deliveries can't both read "no existing sub"
 * and both think they're the fresh upgrade.
 */
export async function upgradeUserPlan(args: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}): Promise<UpgradeResult> {
  return await prisma.$transaction(async (tx: typeof prisma) => {
    const existing = (await tx.user.findUnique({
      where: { id: args.userId },
      select: {
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      } as never,
    })) as {
      plan: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
    } | null;

    // Identical delivery → no-op.
    if (
      existing?.plan === "pro" &&
      existing.stripeCustomerId === args.stripeCustomerId &&
      existing.stripeSubscriptionId === args.stripeSubscriptionId
    ) {
      return { status: "already_current" as const };
    }

    // Already on pro with a DIFFERENT subscription → the user somehow
    // has two active Stripe subscriptions for the same Flareo account.
    // We overwrite our record (taking the newer sub), but surface the
    // stale IDs so the caller can cancel them in Stripe. Otherwise
    // Stripe keeps billing the old subscription indefinitely.
    const isReplacement =
      existing?.plan === "pro" &&
      existing.stripeSubscriptionId !== null &&
      existing.stripeSubscriptionId !== args.stripeSubscriptionId;

    await tx.user.update({
      where: { id: args.userId },
      data: {
        plan: "pro",
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        planUpdatedAt: new Date(),
      } as never,
    });

    if (isReplacement) {
      return {
        status: "replaced" as const,
        previousStripeCustomerId: existing!.stripeCustomerId,
        previousStripeSubscriptionId: existing!.stripeSubscriptionId,
      };
    }
    return { status: "upgraded" as const };
  });
}

/**
 * Revert a user to "free" on subscription cancellation / payment
 * failure. Keeps the Stripe IDs on the row for audit (so we can
 * correlate a refund request with which subscription ended) but
 * stops honoring the paid quota.
 */
export async function downgradeUserPlan(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      planUpdatedAt: new Date(),
    } as never,
  });
}
