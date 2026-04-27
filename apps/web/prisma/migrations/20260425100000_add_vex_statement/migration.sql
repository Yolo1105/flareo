-- VexStatement — per-(module, CVE) reviewer annotations of which
-- Trivy findings are actually exploitable in the way the module is
-- configured. Conforms to the OpenVEX 0.2.0 spec.
--
-- Why a separate table rather than embedding in Module:
--   - Stable schema across catalog growth — a row per CVE rather
--     than a JSON blob field that grows unbounded
--   - Independent indexing on (moduleSlug, status) for the admin
--     "show me everything still under_investigation" view
--   - Audit trail via authorId — the OpenVEX document we publish
--     uses the canonical "Flareo Reviewer Team" author for external
--     attribution, but the internal trail tracks the actual reviewer
--
-- Severity: NULL on rows created before the cveSeverity column was
-- added (subsequent migration). The policy evaluator falls back to
-- a pessimistic "subtract from criticals first" heuristic for those
-- rows; new rows from the admin form populate it from Trivy.
--
-- (moduleSlug, cve) is unique — one statement per CVE per module.
-- Updates overwrite the existing row (and bump updatedAt).
--
-- ON DELETE CASCADE for both FKs:
--   - module deletion is rare and indicates removal from catalog;
--     orphaned VEX statements have no audience
--   - author deletion is also rare; the per-row author record is
--     internal-audit data, not the public attribution

CREATE TABLE "VexStatement" (
  "id"              TEXT PRIMARY KEY,
  "moduleSlug"      TEXT          NOT NULL,
  "cve"             VARCHAR(32)   NOT NULL,
  "status"          VARCHAR(32)   NOT NULL,
  "justification"   VARCHAR(64),
  "impactStatement" TEXT,
  "authorId"        TEXT          NOT NULL,
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "VexStatement_moduleSlug_fkey"
    FOREIGN KEY ("moduleSlug")
    REFERENCES "Module"("slug")
    ON DELETE CASCADE,

  CONSTRAINT "VexStatement_authorId_fkey"
    FOREIGN KEY ("authorId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX "VexStatement_moduleSlug_cve_key"
  ON "VexStatement" ("moduleSlug", "cve");

CREATE INDEX "VexStatement_moduleSlug_status_idx"
  ON "VexStatement" ("moduleSlug", "status");

CREATE INDEX "VexStatement_authorId_idx"
  ON "VexStatement" ("authorId");
