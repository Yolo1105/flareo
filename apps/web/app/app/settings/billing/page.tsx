import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";
import { BillingCta } from "@/components/sections/app-settings/BillingCta";
import {
  getUserPlan,
  getPublicModuleUsage,
  PLAN_LIMITS,
} from "@/lib/billing/quota";
import { isStripeConfigured } from "@/lib/billing/stripe";

export const metadata: Metadata = {
  title: "Billing",
};

export const dynamic = "force-dynamic";

/**
 * The user's plan page. Shows current plan, public-module usage meter,
 * and an upgrade-to-Pro CTA that posts to Stripe when configured.
 *
 * Accepts two optional query params from the checkout flow:
 *   - ?upgraded=1   — shown after Stripe checkout completes successfully.
 *                     The webhook has (or will shortly) flip plan=pro;
 *                     this page just acknowledges the redirect landed.
 *   - ?cancelled=1  — shown when the user clicked Back in Stripe's
 *                     hosted checkout. Reassures them nothing was
 *                     charged.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; cancelled?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // After redirect() (return type `never`), TS may not narrow
  // `session.user`. Capture the non-null user as a const.
  const sessionUser = session!.user!;

  const userId = sessionUser.id;
  const plan = await getUserPlan(userId);
  const usage = await getPublicModuleUsage(userId);
  const planDef = PLAN_LIMITS[plan];
  const otherPlan = plan === "free" ? "pro" : "free";
  const otherPlanDef = PLAN_LIMITS[otherPlan];
  const stripeLive = isStripeConfigured();
  const params = await searchParams;
  const upgraded = params.upgraded === "1";
  const cancelled = params.cancelled === "1";

  const usagePercent =
    usage.limit === null ? 0 : Math.min(100, (usage.used / usage.limit) * 100);
  const usageTone =
    usage.limit === null
      ? "neutral"
      : usagePercent >= 100
        ? "bad"
        : usagePercent >= 66
          ? "warn"
          : "neutral";

  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS · BILLING"
        title="Your plan."
        subtitle="What you're on, what you're using, and what changes if you upgrade."
      />

      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="billing" />

        <div className="space-y-6 px-7 py-7">
          {/* Post-checkout interstitial banners. Rendered once;
              user's next page load clears them by navigating via
              the CTA. */}
          {upgraded && (
            <div className="border border-good bg-good/[0.08] px-5 py-3 font-mono text-[12px] text-good">
              <span className="font-semibold uppercase tracking-[0.14em]">
                Upgraded
              </span>
              <span className="ml-3 text-good/90">
                Welcome to Pro. It may take a few seconds for the plan
                label to update here while the webhook processes.
              </span>
            </div>
          )}
          {cancelled && (
            <div className="border border-hairline bg-canvas px-5 py-3 font-mono text-[12px] text-ink-softer">
              <span className="font-semibold uppercase tracking-[0.14em]">
                Cancelled
              </span>
              <span className="ml-3">
                No charges were made. You can try again whenever you&apos;re ready.
              </span>
            </div>
          )}

          {/* Current plan card */}
          <section className="border border-hairline bg-canvas-deep">
            <div className="flex items-start justify-between border-b border-hairline px-6 py-5">
              <div>
                <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-accent">
                  CURRENT PLAN
                </div>
                <h2 className="font-display text-[26px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
                  {plan === "pro" ? "Pro" : "Free"}
                </h2>
                <div className="mt-1 font-mono text-[12px] text-ink-softer">
                  {planDef.priceLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                  REVIEW SLA
                </div>
                <div className="font-display text-[18px] font-black tracking-[-0.02em] text-ink">
                  {planDef.reviewSlaHours}h
                </div>
                <div className="font-mono text-[10.5px] text-ink-ghost">
                  time to first reviewer look
                </div>
              </div>
            </div>

            {/* Usage meter */}
            <div className="px-6 py-5">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="font-mono text-[10px] tracking-[0.14em] text-accent">
                  PUBLIC MODULES
                </div>
                <div
                  className={`font-mono text-[12px] ${
                    usageTone === "bad"
                      ? "text-bad"
                      : usageTone === "warn"
                        ? "text-warn"
                        : "text-ink-softer"
                  }`}
                >
                  {usage.used} /{" "}
                  {usage.limit === null ? "∞" : usage.limit}
                </div>
              </div>
              {/* Bar */}
              <div className="mb-3 h-2 w-full border border-hairline bg-canvas">
                <div
                  className={`h-full transition-all ${
                    usageTone === "bad"
                      ? "bg-bad"
                      : usageTone === "warn"
                        ? "bg-warn"
                        : "bg-accent"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="font-mono text-[11px] text-ink-ghost">
                <span className="text-ink-softer">{usage.published}</span>{" "}
                published · <span className="text-ink-softer">{usage.inFlight}</span>{" "}
                in-flight (pending / approved / building)
              </div>
              {usage.limit !== null && usage.remaining === 0 && (
                <div className="mt-3 border border-warn bg-warn/[0.08] px-3 py-2 font-mono text-[11.5px] text-warn">
                  You&apos;re at your {plan}-plan limit. Finish or reject an
                  in-flight submission, or upgrade to submit more.
                </div>
              )}
            </div>
          </section>

          {/* Upgrade / cross-sell card */}
          <section className="border border-hairline bg-canvas-deep">
            <div className="border-b border-hairline px-6 py-4">
              <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-accent">
                {plan === "free" ? "UPGRADE TO PRO" : "PLANS"}
              </div>
              <h3 className="font-display text-[18px] font-black leading-[1.1] tracking-[-0.02em] text-ink">
                {plan === "free"
                  ? "More headroom, faster reviews, private modules."
                  : "You're on Pro. Here's what's included."}
              </h3>
            </div>

            <div className="grid grid-cols-2 divide-x divide-hairline">
              {/* Free column */}
              <div className="px-6 py-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <div className="font-display text-[16px] font-black tracking-[-0.02em] text-ink">
                    Free
                  </div>
                  <div className="font-mono text-[11px] text-ink-ghost">
                    {PLAN_LIMITS.free.priceLabel}
                  </div>
                </div>
                <ul className="space-y-1.5 font-body text-[12.5px] text-ink-softer">
                  <li>
                    {PLAN_LIMITS.free.maxConcurrentPublicModules} concurrent
                    public modules
                  </li>
                  <li>No private modules</li>
                  <li>{PLAN_LIMITS.free.reviewSlaHours}h review SLA</li>
                  <li>Full catalog access, verify, CLI</li>
                </ul>
              </div>

              {/* Pro column */}
              <div className="bg-accent/[0.02] px-6 py-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <div className="font-display text-[16px] font-black tracking-[-0.02em] text-accent">
                    Pro
                  </div>
                  <div className="font-mono text-[11px] text-accent">
                    {PLAN_LIMITS.pro.priceLabel}
                  </div>
                </div>
                <ul className="space-y-1.5 font-body text-[12.5px] text-ink-softer">
                  <li>Unlimited public modules</li>
                  <li>
                    Up to{" "}
                    {PLAN_LIMITS.pro.maxConcurrentPrivateModules} private
                    modules
                  </li>
                  <li>{PLAN_LIMITS.pro.reviewSlaHours}h priority review SLA</li>
                  <li>Higher API rate limits</li>
                  <li>Email support within 24h</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between border-t border-hairline px-6 py-4">
              <div className="font-mono text-[11px] text-ink-ghost">
                {plan === "free"
                  ? stripeLive
                    ? "Billing is powered by Stripe. Cancel any time from this page."
                    : "Billing isn't wired yet — the upgrade button will activate once Stripe is configured."
                  : "Manage billing on Stripe. Update payment method, download invoices, or cancel."}
              </div>
              <BillingCta
                kind={plan === "free" ? "upgrade" : "portal"}
                stripeConfigured={stripeLive}
              />
            </div>
          </section>

          {/* What changes if I upgrade / downgrade */}
          <section className="border border-hairline bg-canvas px-5 py-4">
            <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              IF YOU {plan === "free" ? "UPGRADE" : "CANCEL"}
            </div>
            <ul className="space-y-1 font-body text-[12.5px] leading-[1.6] text-ink-softer">
              {plan === "free" ? (
                <>
                  <li>
                    Your existing {usage.used} public module
                    {usage.used === 1 ? "" : "s"} stay published — nothing
                    moves or disappears.
                  </li>
                  <li>
                    The quota cap lifts immediately; new submissions are
                    accepted without the 3-module limit.
                  </li>
                  <li>
                    Review SLA drops from{" "}
                    {PLAN_LIMITS.free.reviewSlaHours}h to{" "}
                    {PLAN_LIMITS.pro.reviewSlaHours}h for submissions
                    queued after the upgrade.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Your existing modules remain published. Public modules
                    stay free to own forever; only new submissions are
                    gated by the plan.
                  </li>
                  <li>
                    Private modules stay accessible to you but can no
                    longer be updated. Re-subscribe to resume updates, or
                    delete them to free quota.
                  </li>
                  <li>
                    API rate limits revert to free-tier levels at the end
                    of the current billing period.
                  </li>
                </>
              )}
            </ul>
          </section>

          {/* Debug block — only shown in dev to make the plan/usage
              situation obvious while testing. Safe to leave in: the
              page is auth-gated and the data is already about the
              viewer. */}
          {process.env.NODE_ENV !== "production" && (
            <section className="border border-dashed border-ink-faint bg-canvas px-5 py-4 font-mono text-[10.5px] text-ink-ghost">
              <div className="mb-2 tracking-[0.14em]">DEV DEBUG</div>
              <pre className="whitespace-pre-wrap leading-[1.55]">
{JSON.stringify(
  {
    plan,
    otherPlan,
    otherPlanDef: {
      maxConcurrentPublicModules: otherPlanDef.maxConcurrentPublicModules,
      reviewSlaHours: otherPlanDef.reviewSlaHours,
    },
    usage,
  },
  null,
  2,
)}
              </pre>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
