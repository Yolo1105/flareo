-- Billing fields on User. Additive; existing rows default to plan="free"
-- and NULL Stripe IDs, which is the correct state for everyone on the
-- system at this point (no paid tier has been launched yet).
--
-- When Stripe is wired in a follow-up session, the checkout-completed
-- webhook writes plan='pro' plus both Stripe IDs in a single UPDATE,
-- and the portal-event webhook flips plan back to 'free' on cancellation.
--
-- Verify after applying with:
--     \d "User"   in psql, or inspect via Prisma Studio.

ALTER TABLE "User"
  ADD COLUMN "plan"                 TEXT         NOT NULL DEFAULT 'free',
  ADD COLUMN "stripeCustomerId"     TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "planUpdatedAt"        TIMESTAMP(3);

-- Unique indexes so stray duplicate Stripe webhook deliveries fail
-- loudly rather than creating phantom second-users. Both allow NULL
-- because most rows won't have these set.
CREATE UNIQUE INDEX "User_stripeCustomerId_key"
  ON "User" ("stripeCustomerId");

CREATE UNIQUE INDEX "User_stripeSubscriptionId_key"
  ON "User" ("stripeSubscriptionId");
