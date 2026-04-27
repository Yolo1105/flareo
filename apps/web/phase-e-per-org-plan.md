# Phase E (deferred) — per-org policy override

**UPDATE 2026-04-26:** speculative schema + data-layer scaffold landed before trigger fired. User explicitly authorized speculative build. See decisions.md G-2 for the dated entry.

What shipped speculatively:
- Schema models: `Org`, `OrgMember`, `AdmissionPolicyOrg`, `User.orgMemberships` and `User.orgAdmissionPolicies` relations.
- Migration: `prisma/migrations/20260426000000_speculative_gated_scaffolds/migration.sql`.
- Data layer: `lib/db/org-policy.ts` with `getActiveOrgPolicy()` and `saveOrgPolicy()`.

What's still NOT built:
- Org membership UI ("invite a teammate")
- Per-org policy editor in admin UI
- Resolution semantics integration into the worker policy-evaluate endpoint (worker still uses catalog-wide policy only)
- Billing migration from User.stripeCustomerId to Org.stripeCustomerId
- Org-scoped API key gating

When a real customer arrives, expect to throw away parts of the speculative shape and design against their actual requirements. The educated-guess shape below is what's in code today.

This file is a **plan**, not implemented code. It exists so that whenever a paying organization actually asks for per-org admission policies, the next session has a head start and doesn't have to re-derive the design.

## Why deferred

When this came up in the OPA continue session, the brief was "if you've got a paying org asking." We didn't, and don't. Two reasons not to build now:

1. **No Org model exists in the schema.** Building per-org policy means first inventing the Org concept (org table, user-org membership, billing-to-org plumbing). That's a substantial schema change with downstream API and UI work — not a small per-org-policy patch. The right time to introduce Org is when there's real org demand to design against.
2. **Speculative scope is the F0 anti-pattern.** The whole point of the F0 30-day clock approach is to gate work behind evidence. A per-org policy with no orgs is the same anti-pattern in a different domain.

The default path stays: catalog runs the singleton admission policy (`AdmissionPolicy.revision = MAX(revision)`), all consumers (UI, public verdict endpoint, worker-side enforcement) use that single policy.

## What would need to ship

When demand lands, this is the rough roadmap. Estimates assume the Org concept also gets built in the same iteration — if Org already exists by then, the policy-override piece compresses to ~1 session.

### Step 1: Org concept

```
model Org {
  id             String   @id @default(cuid())
  name           String   @db.VarChar(80)
  slug           String   @unique @db.VarChar(64)
  /// Stripe customer for invoicing. NULL for orgs in trial.
  stripeCustomerId String? @db.VarChar(64)
  /// Org tier — drives quota and feature gates.
  /// "team" | "enterprise"; future "starter" if needed.
  tier           String   @default("team") @db.VarChar(16)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  members        OrgMember[]
  policies       AdmissionPolicy[]
  apiKeys        ApiKey[]  // existing model gets orgId
}

model OrgMember {
  id        String   @id @default(cuid())
  orgId     String
  org       Org      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String   @default("member") @db.VarChar(16) // "owner" | "admin" | "member"
  createdAt DateTime @default(now())

  @@unique([orgId, userId])
  @@index([userId])
}
```

The Org model is bigger than just the membership table — billing migration from the existing `User.stripeCustomerId` to `Org.stripeCustomerId`, API-key scoping to orgs, the "switch active org" UI in the app shell.

### Step 2: AdmissionPolicy gets an org column

```
model AdmissionPolicy {
  id          String   @id @default(cuid())
  /// NULL means catalog-wide policy. NOT NULL means an org-specific
  /// override that applies only when the consumer is operating in
  /// that org's context.
  orgId       String?
  org         Org?     @relation(fields: [orgId], references: [id], onDelete: Cascade)
  revision    Int
  policyJson  String   @db.Text
  notes       String   @db.Text
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  /// Revisions are unique within their scope (catalog or per-org).
  /// Two policies with revision=5 — one catalog, one for org "acme" —
  /// is fine. Two catalog policies both at revision=5 is not.
  @@unique([orgId, revision])
  @@index([authorId])
  @@index([createdAt])
}
```

Migration is destructive of the existing unique constraint on `revision` alone — needs a careful sequence:

```sql
-- Add orgId NULL'd for all existing rows (= catalog policies)
ALTER TABLE "AdmissionPolicy" ADD COLUMN "orgId" TEXT;

-- Drop the old single-column unique
DROP INDEX "AdmissionPolicy_revision_key";

-- Replace with the composite unique
CREATE UNIQUE INDEX "AdmissionPolicy_orgId_revision_key"
  ON "AdmissionPolicy" ("orgId", "revision")
  -- Postgres treats NULL as distinct from itself in unique indexes,
  -- which is what we want: catalog (orgId=NULL) is one scope, each
  -- org is its own scope, and the constraint enforces "monotonic
  -- revisions within scope" without false collisions.
  ;

-- FK to Org
ALTER TABLE "AdmissionPolicy"
  ADD CONSTRAINT "AdmissionPolicy_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE;
```

### Step 3: Resolution semantics

When a consumer (worker, public endpoint, Kyverno apiCall) asks for a verdict on a module, which policy is used?

Three model options, in increasing complexity:

**Option A (recommended for v1):** explicit context.
- Consumers without an org context get the catalog policy.
- Consumers in an org context get THAT org's policy if one exists, otherwise catalog.
- "Org context" comes from the API key's `orgId` (if the key is org-scoped) or the session's `activeOrgId`.

**Option B:** layered policies.
- Org policy is a *delta* against catalog — adds rules, tightens thresholds, can't loosen.
- Conceptually nicer (one source of truth, deltas explicit) but harder to implement and reason about.

**Option C:** independent policies.
- Org policy is fully self-contained, has nothing to do with catalog.
- Simpler than B, but means org admins must keep up with catalog policy improvements manually.

For v1 ship Option A. It's the simplest mental model and "org policy replaces catalog policy when in org context" is what most procurement-driven asks expect.

### Step 4: Data-layer reads

`getActivePolicy()` grows an `orgId?` parameter:

```ts
export async function getActivePolicy(
  orgId?: string | null,
): Promise<ActivePolicyResult> {
  // Try org-scoped first if orgId provided
  if (orgId) {
    const orgPolicy = await prisma.admissionPolicy.findFirst({
      where: { orgId },
      orderBy: { revision: "desc" },
      include: { author: { select: { name: true, email: true } } },
    });
    if (orgPolicy) return resultFor(orgPolicy);
  }
  // Fall through to catalog
  return getCatalogActivePolicy();
}
```

Caller sites that need updating:
- `evaluateAndPersist` in `lib/db/policy.ts` — accept orgId, pass to `getActivePolicy`
- `/api/v1/modules/[slug]/policy/route.ts` — read orgId from auth context, pass through
- `/api/v1/worker/policy-evaluate/route.ts` — accept orgId in request body (worker passes the submission's submitting-org if any)
- `regenerateAllVerdicts` — needs rethinking; per-org regeneration becomes a per-org sweep, and `ModulePolicyVerdict` needs an orgId too (or becomes a `(moduleSlug, orgId)` keyed table)

The `ModulePolicyVerdict` change is the trickiest part. Either:
- Add orgId to its unique key (now `(moduleSlug, orgId)`), keep one cached verdict per (module, org)
- Drop caching for org-scoped evaluations and recompute live

The first scales better but adds storage cost; the second is simpler but slow at scale. Probably start with #2 (recompute live for orgs, cache only catalog) and migrate to #1 if needed.

### Step 5: Admin UI

- "Admission policy" admin page grows an org switcher dropdown at the top
- Below the editor: a list of orgs that have overrides, with quick-edit links
- Each revision in the audit trail tagged with its scope (catalog or org-X)

### Step 6: Public framing

- `/docs/admission` page extends the "querying Flareo's own admission verdict" section with the per-org variant: `GET /api/v1/orgs/<slug>/policy/modules/<module-slug>` or whatever URL shape we pick
- Pricing page: per-org policies become a Pro/Enterprise feature with a clear tier gate

## When to ship

Trigger conditions, any one is sufficient:

1. A specific paying customer asks for it as a hard requirement
2. ≥3 prospects mention it in sales conversations within the same quarter
3. A regulated-industry deal (gov, fintech) is contingent on it

If the trigger is #1, the customer contract specifies what they need; design around their requirements rather than the speculative shape above. The shape above is the educated guess for "what most asks would look like" — but real asks always have surprises.

## What this file is NOT

Not a commitment. Not a prioritized roadmap item. The proposal flagged per-org as v2 follow-on, my OPA notes flagged it as deferred, and this file just keeps the design groundwork visible so the next session is faster, not the current session larger.

If the answer in 6 months is "we never needed this and shipped per-customer self-host instead," delete this file and move on. The catalog-singleton policy is sufficient for the current product.
