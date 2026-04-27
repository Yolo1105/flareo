-- Speculative gated-item scaffolds (G-1 through G-5).
--
-- These tables ship the schema for features that are deferred behind
-- evidence triggers in DECISIONS.md. The migration is purely additive
-- so it's safe to apply against a populated production DB even when
-- the corresponding gates haven't fired yet.
--
-- When a gate fires and real customer requirements arrive, expect
-- ALTER TABLE migrations to evolve these shapes. The current shape is
-- the educated guess for "what most asks would look like."
--
-- All ON DELETE CASCADE is intentional: speculative data has no
-- downstream consumers worth preserving across deletion of the
-- referenced parent row.

-- G-1: per-user preview instances
CREATE TABLE "PreviewInstance" (
  "id"           TEXT PRIMARY KEY,
  "userId"       TEXT          NOT NULL,
  "moduleSlug"   TEXT          NOT NULL,
  "status"       VARCHAR(16)   NOT NULL,
  "hostId"       VARCHAR(128),
  "subdomain"    VARCHAR(128),
  "allocatedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"    TIMESTAMP(3)  NOT NULL,
  "lastActiveAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "errorMessage" TEXT,

  CONSTRAINT "PreviewInstance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,

  CONSTRAINT "PreviewInstance_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug") REFERENCES "Module"("slug") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "PreviewInstance_userId_moduleSlug_status_key"
  ON "PreviewInstance" ("userId", "moduleSlug", "status");

CREATE INDEX "PreviewInstance_userId_status_idx"
  ON "PreviewInstance" ("userId", "status");

CREATE INDEX "PreviewInstance_expiresAt_idx"
  ON "PreviewInstance" ("expiresAt");

-- G-2 / G-5: organization concept
CREATE TABLE "Org" (
  "id"               TEXT          PRIMARY KEY,
  "name"             VARCHAR(80)   NOT NULL,
  "slug"             VARCHAR(64)   NOT NULL,
  "stripeCustomerId" VARCHAR(64),
  "tier"             VARCHAR(16)   NOT NULL DEFAULT 'team',
  "selfHostedAt"     TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)  NOT NULL
);

CREATE UNIQUE INDEX "Org_slug_key" ON "Org" ("slug");
CREATE INDEX "Org_tier_idx" ON "Org" ("tier");

CREATE TABLE "OrgMember" (
  "id"        TEXT          PRIMARY KEY,
  "orgId"     TEXT          NOT NULL,
  "userId"    TEXT          NOT NULL,
  "role"      VARCHAR(16)   NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrgMember_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE,

  CONSTRAINT "OrgMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "OrgMember_orgId_userId_key"
  ON "OrgMember" ("orgId", "userId");

CREATE INDEX "OrgMember_userId_idx" ON "OrgMember" ("userId");

-- G-2: per-org admission policy
CREATE TABLE "AdmissionPolicyOrg" (
  "id"          TEXT          PRIMARY KEY,
  "orgId"       TEXT          NOT NULL,
  "revision"    INTEGER       NOT NULL,
  "policyJson"  TEXT          NOT NULL,
  "notes"       TEXT          NOT NULL,
  "authorId"    TEXT          NOT NULL,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdmissionPolicyOrg_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE,

  CONSTRAINT "AdmissionPolicyOrg_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "AdmissionPolicyOrg_orgId_revision_key"
  ON "AdmissionPolicyOrg" ("orgId", "revision");

CREATE INDEX "AdmissionPolicyOrg_authorId_idx"
  ON "AdmissionPolicyOrg" ("authorId");

CREATE INDEX "AdmissionPolicyOrg_createdAt_idx"
  ON "AdmissionPolicyOrg" ("createdAt");

-- G-3 / G-4: SLSA + reproducible-build readiness per module
CREATE TABLE "ModuleProvenance" (
  "id"              TEXT          PRIMARY KEY,
  "moduleSlug"      TEXT          NOT NULL,
  "slsaLevel"       INTEGER       NOT NULL DEFAULT 2,
  "reproducible"    BOOLEAN       NOT NULL DEFAULT FALSE,
  "l3AttestedAt"    TIMESTAMP(3),
  "reproducedAt"    TIMESTAMP(3),
  "diffArtifactUrl" TEXT,
  "updatedAt"       TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "ModuleProvenance_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug") REFERENCES "Module"("slug") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ModuleProvenance_moduleSlug_key"
  ON "ModuleProvenance" ("moduleSlug");
