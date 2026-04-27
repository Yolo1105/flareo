# Demo visibility — full seed coverage

The question: "does every feature we built show up when a demo visitor clicks through the site?"

## What I found

Walked every page a visitor would click, starting from the landing page and following real links. Result: the static-fixture-backed surfaces all worked, but every **marketplace / operational feature added in later sessions had no seed data**. Empty zero-states across the board:

| Feature | Demo-visible before? |
|---|---|
| Homepage sections (hero, pitch, catalog preview, pricing preview) | ✅ |
| `/catalog` main grid (12 fixture modules) | ✅ |
| `/catalog` Featured strip | ❌ (no seed, hidden entirely) |
| `/catalog` Trending strip | ❌ (needs reviews, hidden) |
| `/modules/<slug>` hero + receipts + deploy + SBOM | ✅ (derived from module) |
| `/modules/<slug>` rebuild history | ❌ (empty state) |
| `/modules/<slug>` reviews section | ❌ (empty state) |
| `/modules/<slug>` report panel (button itself) | ✅ |
| `/@<handle>` publisher profiles | ❌ (no seeded user with username) |
| `/verify`, `/pricing`, `/docs/*` | ✅ |
| `/app/submissions/*` (signed in) | ❌ (empty for new user) |
| `/app/admin` queue, rebuilds log, reviews queue, reports queue | ❌ (all empty) |
| Admin featured curator UI | ❌ (empty) |

Root cause: `prisma/seed.ts` only seeded the 12 modules. Everything else — the features from Track A marketplace + build worker observability — had zero seed fixtures.

## What I did

Rewrote `prisma/seed.ts` with full demo coverage. Still behind `SEED=1` gate so prod won't be clobbered. Now seeds:

**4 demo users** with usernames, bios, websites. One admin (`flareo-admin`), three publishers (`mai-ops`, `marco`, `priya-runs-it`).

**Module-to-publisher links.** Half the 12 fixture modules get linked to a demo publisher. The other half stay unowned, deliberately, so the demo shows both states: author name as link (when publisher exists) vs. plain text (when it doesn't).

**12 reviews** spread across 5 modules — vaultwarden, uptime-kuma, authentik, immich, grafana. Mix of ratings (2/3/4/5 stars) so histograms and averages aren't uniformly 5.0. Body content varies from short endorsement to operator feedback to specific technical critique.

**4 featured modules** (positions 1-4) with editorial blurbs. Mix of indefinite and 14/30-day expirations so both states are demonstrable in the admin curator.

**5 rebuild history rows per module** = 60 total. Pattern: four successful + one variant (unchanged / failed). One module (`keycloak`) gets its most recent rebuild flipped to `build_failed` so the rebuild log's "failures" filter has something to find. `lastRebuiltAt` stamped on each module based on most recent SUCCESSFUL rebuild (matches the SLA badge logic).

**4 historical submissions** covering the lifecycle: one `built`, one `rejected`, one `changes_requested`, one `pending`. Admin queue now has something to triage; submitter history pages (for `mai-ops` / `priya-runs-it` / `marco`) all show recent activity.

**3 reports** across 3 states: `open` (nginx-proxy-manager LE bug report), `investigating` (gitea metadata question), `resolved` (jellyfin SLSA claim mismatch, with resolution note from the admin). The admin reports queue now has content in every section.

## What a demo visitor sees now (seeded)

1. **Landing page** — unchanged, all sections visible
2. **Catalog** — Featured strip with 4 picks, Trending strip computed from review activity, main grid with 12 modules
3. **Any module page** — hero with trust + rebuild-SLA badge colored correctly (seed sets `lastRebuiltAt` inside the 26h "today" window), Receipts (per-module derived), Deploy, SBOM, Rebuild history with 5 rows, Reviews section with histogram, Report panel
4. **vaultwarden specifically** — 3 reviews with one at 4★ and two at 5★, histogram shows a non-flat distribution. Publisher link goes to `/@mai-ops`.
5. **Publisher profile** `/@mai-ops` — shows 3 modules, reviews written, stat tiles non-zero
6. **Sign up + sign in** — works as before
7. **Admin queue** — 1 pending submission to triage + 1 in-flight build + historical builds in sidebar
8. **Admin reports** — 1 open + 1 investigating + 1 resolved (with ?history=1)
9. **Admin reviews moderation** — empty by default (nothing flagged; that's fine — flagging is user-initiated, not seeded)
10. **Admin featured curator** — 4 active features editable
11. **Admin rebuild log** — 60 rows, failure filter shows the keycloak one

No more empty zero-states on any demo-visible surface.

## Running the seed

```
SEED=1 npx prisma db seed
```

Idempotent — every row uses upsert-by-id so reruns don't duplicate. If you want a different admin user promoted beyond the seeded one:

```
SEED=1 ADMIN_EMAIL=you@example.com npx prisma db seed
```

## What's deliberately NOT seeded

- **Flagged reviews.** The review moderation queue is empty until a real user flags a review. I didn't seed flags because flagging is a user action — seeding moderator-visible "bad behavior" examples would muddy the demo.
- **Private modules.** Visibility demo is covered by the public/unpublished pair; private modules require a Pro subscription which the seed doesn't simulate.
- **Your own user account.** First-time sign-in creates your user naturally through OAuth/magic-link — that's the expected demo path.
- **Real API keys.** Placeholder hashes would be meaningless; users can create real ones via the settings page.

## Project state

All features built across the quarter now demo-visible with seed:

- ✅ Core pipeline (catalog, module detail, verify, publishing flow)
- ✅ Admin operational surface (queue, rebuilds, worker health)
- ✅ Billing + rate limiting
- ✅ Marketplace #1 reviews
- ✅ Marketplace #2 publisher profiles
- ✅ Marketplace #3 featured/trending curation
- ✅ Marketplace #4 reports inbox
- ✅ Submitter tracking pages
- ✅ Rebuild SLA badge on module hero

The earlier fixtures-only seed was a blind spot — a 10-second rerun of `SEED=1 npx prisma db seed` now shows every feature in the product. Previously the marketplace features were invisible on a clean checkout, which undermined the whole point of building them.
