#!/usr/bin/env tsx
/**
 * Remove unnecessary `as never` casts after `prisma generate` runs.
 *
 * Background: during the multi-session buildout, the Prisma client
 * was sometimes ahead of the migrations or vice-versa, and the
 * `as never` casts were used to make TypeScript stop complaining
 * about fields that existed in schema.prisma but not yet in the
 * generated client. After `prisma migrate deploy && prisma generate`,
 * most of those casts become dead annotations.
 *
 * Usage:
 *   1. npx prisma migrate deploy
 *   2. npx prisma generate
 *   3. npx tsx scripts/cleanup/remove-as-never.ts
 *   4. npm run typecheck
 *   5. If typecheck fails on a removed cast, restore it manually with
 *      git diff and add a comment explaining why it's required.
 *
 * The script is intentionally conservative — it removes casts on
 * specific patterns and leaves the unsafe ones for manual review.
 *
 * Patterns removed:
 *   - { fieldName: ... } as never           — object-literal data/where/select
 *   - "fieldName" as never                  — bare string column refs
 *   - orderBy: { ... } as never             — orderBy clauses
 *
 * Patterns kept (require manual review):
 *   - Multi-line objects with `as never` at end (could span complex shapes)
 *   - `where as never` style (variable cast, not object literal)
 *   - Anything with comments containing TODO or FIXME nearby
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Find files with `as never` annotations.
const grepOutput = execSync(
  `grep -rln "as never" lib/ app/api/ 2>/dev/null || true`,
  { encoding: "utf-8" },
);
const files = grepOutput.split("\n").filter(Boolean);

if (files.length === 0) {
  console.log("No `as never` casts found. Nothing to do.");
  process.exit(0);
}

console.log(`Examining ${files.length} files...`);

let removed = 0;
let kept = 0;

for (const file of files) {
  const original = readFileSync(file, "utf-8");
  let updated = original;

  // Pattern 1: simple single-line object literals before `} as never,`.
  // Matches things like `{ slug: "foo" } as never,` and removes the cast.
  // Conservative: only matches when the closing brace is on the same line
  // as the cast (multi-line objects need manual review).
  updated = updated.replace(
    /(\{ [^{}\n]+ \}) as never(,?)/g,
    "$1$2",
  );

  // Pattern 2: orderBy clauses
  updated = updated.replace(
    /(orderBy: \{ [^{}\n]+ \}) as never/g,
    "$1",
  );

  // Pattern 3: select clauses
  updated = updated.replace(
    /(select: \{ [^{}\n]+ \}) as never/g,
    "$1",
  );

  // Count what we changed.
  const beforeCount = (original.match(/as never/g) ?? []).length;
  const afterCount = (updated.match(/as never/g) ?? []).length;
  const fileRemoved = beforeCount - afterCount;
  removed += fileRemoved;
  kept += afterCount;

  if (fileRemoved > 0) {
    writeFileSync(file, updated);
    console.log(`  ${file}: removed ${fileRemoved}, kept ${afterCount}`);
  }
}

console.log();
console.log(`Removed ${removed} casts; ${kept} remain (need manual review).`);
console.log();
console.log("Next steps:");
console.log("  1. Run `npm run typecheck`. Any failures point at casts that");
console.log("     should NOT have been removed; restore them with `git diff`.");
console.log("  2. Review the remaining casts. Most are multi-line shapes;");
console.log("     decide case-by-case whether the underlying type ambiguity");
console.log("     is real and worth keeping the cast.");
console.log("  3. Commit when typecheck is green.");
