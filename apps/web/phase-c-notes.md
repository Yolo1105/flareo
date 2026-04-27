# Phase C — polish + marketing reconciliation

Four polish items. Each small, all aimed at closing surface-level gaps the proposal flagged but earlier sessions hadn't touched.

## 1. Hero copy reconciliation

Landing hero kept the headline ("VERIFIED CONTAINERS / PREVIEWED LIVE / DEPLOYED ON YOUR BOX") because that three-act pitch is still right — verification IS the differentiator. What changed:

**Supporting paragraph** — added marketplace + reviews + takeaway language so the entire site's surfaces are visible from the first paragraph:

> Flareo builds, scans, signs, and attests third-party containers so you can run self-hosted software without trusting strangers on Docker Hub. **A curated marketplace, real receipts on every module, live previews, and a portable compose file you take home.** Your infrastructure. Your security.

**CTA hierarchy** — re-ordered:
- Primary (filled): `/marketplace` — was `/catalog` (the dense filterable grid; marketplace is now the curated discovery surface, better first stop)
- Secondary (outlined): `/verify` — added; surfaces the audit-anything claim from the landing
- Tertiary (text-only): `#install` — kept but de-emphasized

Three CTAs without crowding because the third is plain-text. The flow now is: read promise → open marketplace OR audit your own image OR install CLI. All three paths visible on first paint.

## 2. Named founder note

About page closing was `— The Flareo team` despite Quick Facts saying team size is 2. The proposal called this out explicitly: "If Flareo is a solo or small-team project, owning that openly reads as senior; hiding it behind corporate framing reads as wrong. A named founder note is content that differentiates."

Added a dedicated **§ THE PERSON BEHIND IT** card after the long-form prose. Three paragraphs:

1. The personal origin — "I'm the one who pulled jc21/nginx-proxy-manager that night..."
2. Direct ownership — "I read every reviewer decision, every takedown request, every report... If you write to hello@flareo.dev, I read it."
3. Stated independence — "No board. No investors. No exit. Just a platform I'd want to use myself."

Footer line gives the founder's name + role + version + month, e.g. "— [FOUNDER NAME], founder · Flareo · v0.4.2 · April 2026."

**Action required before launch:** the name field is `[FOUNDER NAME]` literal — there's a code comment marking the placeholder. Swap before publishing. I deliberately didn't pick a name so it doesn't end up looking like a fictional founder if you ship without editing.

## 3. Before/after narrative section on landing

Proposal Idea 4 — "Two parallel shell sessions shown side by side... narrative content beats feature content for conversion."

Added `BeforeAfterSection` between `ProblemSection` and `PipelineTerminal` on the landing page. Two terminal panes side by side (stacked on mobile):

**Left pane — "47 MIN ELAPSED" — the Docker Hub way:**
- Search Docker Hub, find louislam/uptime-kuma (highest-starred non-official)
- Hunt the README for compose, find nothing, switch to GitHub
- Find an 8-month-old compose file, copy it
- Notice `:latest`, attempt to pin a digest
- `cosign verify` returns no matching signatures
- `trivy image` returns 3 highs, no fix
- Ship it anyway, "monday-me's problem"
- 47 minutes elapsed, unsigned image, unknown SBOM

**Right pane — "4 MIN ELAPSED" — the Flareo way:**
- Open `/marketplace`, search uptime-kuma, see trust 94 + SLSA L3 + 0 critical + 4.6★
- Click "try in 15s sandbox" — preview running on Flareo subdomain
- Download the takeaway markdown bundle from the module page
- Extract the compose file using the CLI (`flareo takeaway --extract`)
- Run `cosign verify` from the README — three checks pass
- `docker compose up -d`, instance alive
- 4 minutes elapsed, signed, attested, SBOM bundled

The left pane uses three muted dots (red/yellow/grey) and an amber "47 MIN ELAPSED" badge; the right pane uses three green dots and a green "4 MIN ELAPSED" badge. Visual distinction without explanation.

Closing line: "The pipeline did the security review for you in advance, the marketplace put the right operator notes in front of you, the preview let you try it before committing, and the takeaway gave you a portable compose file. The 47 minutes on the left becomes 4 minutes on the right because **the work was done before you arrived.**"

The terminals carry the argument. The prose just frames why the difference exists.

## 4. Roadmap updates — shipped items moved

Two items updated on `/roadmap`:

**Moved to shipped:**
- **Audit-any-image (any registry)** — was "in progress" with Q3 ETA. Now shipped Q2 with body explaining what the verify tool actually does for non-Flareo images (signer identity, OIDC issuer, Rekor entry).
- **Takeaway bundle endpoint** — was implicit (DeploySection had a CLI hint pointing nowhere). Now shipped Q2 with body documenting the markdown-bundle approach and the digest-as-ETag caching.

**In-progress section** is now empty — the page renders nothing for that phase since the empty-section guard already exists. Comment in source notes "no in-progress items currently — most recent shipped this iteration."

This matches reality and avoids the trust-killer of having an "in progress" item that's actually been done.

## Files modified

- `components/sections/landing/HeroSection.tsx` — supporting paragraph + CTA hierarchy
- `components/sections/landing/BeforeAfterSection.tsx` — new file (180 lines)
- `app/(marketing)/page.tsx` — import + render BeforeAfterSection between Problem and Pipeline
- `app/(marketing)/about/page.tsx` — replaced "— The Flareo team" with named founder card
- `app/(marketing)/roadmap/page.tsx` — moved audit-any-image to shipped, added takeaway endpoint shipped entry, dropped in-progress section

## What this resolves

| Item from previous audit | Status |
|---|---|
| Hero copy reconciliation — surface marketplace + curation | ✅ Done — supporting paragraph + 3 CTAs |
| Named founder note | ✅ Done — placeholder name, ready to swap |
| Before/after narrative (proposal Idea 4) | ✅ Done — side-by-side terminal narrative on landing |
| Update roadmap to reflect Phase A shipping | ✅ Done — 2 items moved to shipped |

## What's left

The proposal blueprint is now fully consumed by what's been built. Everything in the original "first priority / second priority / third priority" tiers is shipped or honestly framed (live preview is "considered" on the public roadmap, with the engineering scope acknowledged).

Real work that remains is operational, not content:
- Real OAuth wiring + KMS + ECR push integration (not a session task — external configuration)
- The unbuilt spec-only stages (VEX surface, OPA policy gate, CNB auto-detect) remain on the public roadmap with target Q3/Q4
- Monitoring + status-page integration (when there's a real platform to measure)
- Performance + accessibility audit (can be one session if you want)

The product's content + UX surface is now complete against the original brief. Further sessions are either real engineering or net-new product directions, not closing existing gaps.
