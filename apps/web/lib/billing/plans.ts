/**
 * Plan-tier constants. Pure data, no Prisma or env imports — safe to
 * import from both server and client components.
 *
 * Single source of truth for plan labels and limits. The server-side
 * `lib/billing/quota.ts` re-exports `PLAN_LIMITS` from here; client
 * components that need to display "Pro ($12/month)" import directly
 * from this file.
 *
 * If you change the price, change PLAN_LIMITS.pro.priceLabel here.
 * Every UI surface that displays the price reads from this constant.
 */

export type PlanKey = "free" | "pro";

export interface PlanLimits {
  /** Max public modules a user on this plan can have at once. */
  maxConcurrentPublicModules: number | "unlimited";
  /** Max private modules. 0 means private isn't allowed at all. */
  maxConcurrentPrivateModules: number | "unlimited";
  /** Soft commitment for the publish-flow review SLA, in hours. */
  reviewSlaHours: number;
  /** Multiplier applied to base API rate-limit buckets. */
  rateLimitMultiplier: number;
  /**
   * Display-only price label for the billing page and pricing page.
   * Single source of truth for the price string — every UI surface
   * that shows the Pro price reads from here.
   */
  priceLabel: string;
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    maxConcurrentPublicModules: 3,
    maxConcurrentPrivateModules: 0,
    reviewSlaHours: 120, // 5 business days
    rateLimitMultiplier: 1,
    priceLabel: "Free",
  },
  pro: {
    maxConcurrentPublicModules: "unlimited",
    maxConcurrentPrivateModules: 20,
    reviewSlaHours: 48, // 2 business days
    rateLimitMultiplier: 5,
    priceLabel: "$12 / month",
  },
};
