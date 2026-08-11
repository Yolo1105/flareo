# Phase A — engineering · audit-any-image + takeaway endpoint

Two A-tier engineering items. Both close the gap between "we say this works" and "you can verify it works" — which the proposal called the strongest trust signal the site can offer.

## A1 — Audit-any-image (verify any registry, not just Flareo)

The `/verify` tool's underlying engine already accepted any registry — `parseImageRef()` handles docker.io, ghcr.io, public.ecr.aws, quay.io, etc., and `verifyImage()` returns five distinct states (verified/signed/unsigned/invalid/error) that work for non-catalog images. What was missing was the framing and the result rendering.

**Fixed:**

- **Page hero copy** rewritten from "Paste any Flareo image" (misleading; the tool worked on any image) to "Paste any public image reference — from Flareo, Docker Hub, GHCR, Quay, anywhere." Page metadata + description updated to match.
- **Eyebrow** changed from "VERIFY / PUBLIC TOOL" to "VERIFY / AUDIT ANY IMAGE" so the audit-anything claim is the lede.
- **Examples list** reordered so the first three are non-Flareo (sigstore/cosign, distroless/static, nginx, alpine) — visitors see at a glance that the tool works on images Flareo didn't curate. Flareo example moved to last.
- **"Signed but not by us" rendering expanded** — was a one-line "note: signed, but not in the Flareo catalog. Verify full identity locally." Now shows: signer identity, OIDC issuer, Rekor log index, clickable Rekor entry URL, resolved digest. Plus a closing instruction to run `cosign verify` locally for full identity-chain validation. The proposal's "audit-your-own-image is unusually strong content because it shows the pipeline works on inputs Flareo didn't curate" — visible, not implicit.

What the page now lets a visitor do (no auth required):

| Image type | What they see |
|---|---|
| Flareo-published | Full receipt chain — trust score, CVE counts, SBOM link, scan link |
| Sigstore-signed (any registry) | Signer identity, OIDC issuer, Rekor log index + URL, resolved digest |
| Unsigned | Honest "no signature found" with the reasoning that trust falls back to publisher reputation |
| Invalid (signed but failing scan thresholds) | The error message from the verifier |
| Network or parse error | Diagnostic with the original input echoed |

## A2 — Takeaway bundle endpoint

`DeploySection` already showed compose / Helm / .env / docker run as inline tabs. The download button hinted at `flareo takeaway <slug> --all` — pointing at functionality that didn't exist. Closed the loop:

- **`lib/data/takeaway.ts`** — extracted all four generators (compose, helm, env, run) plus a new README generator into a shared module. ~380 lines. Functions are now callable from both the client component AND a server endpoint.
- **`/api/v1/modules/[slug]/takeaway`** — GET endpoint that returns a single markdown file with all four artifacts in code fences plus a README explaining how to verify the image before deploying.

### Why a single .md file instead of a tarball

Considered: tarball (needs an archive lib), zip (same), multi-file response (HTTP doesn't support that without multipart shenanigans).

Chose markdown:
- No new dependency (no node-tar, no archiver, no jszip)
- Universally readable — works in browser, terminal, IDE, paste-bin, GitHub/Gist
- Each section is in a fenced code block with language hint (`yaml`, `ini`, `bash`) so editors highlight it correctly AND tooling can extract files programmatically by language tag
- Easy to copy individual sections by clicking
- The README is at the top, so a curl response shows the bundle's purpose first

The CLI's `flareo takeaway --extract` (planned, on roadmap) splits the .md back into the four files based on the language tags.

### Endpoint behavior

- **Auth:** none. Public modules are public — including their deployment recipe.
- **Filename:** `<slug>-<version>-takeaway.md` for a sensible browser default.
- **Caching:** 5-minute `Cache-Control: public, max-age=300, s-maxage=300`. The artifacts are deterministic per module digest, so cache hits are correct.
- **ETag:** the module's digest. If the module is rebuilt to a new digest, the bundle is invalidated automatically.
- **Private modules:** 403. The takeaway for private modules goes through the publisher dashboard with auth.
- **Slug validation:** lowercase alphanumeric + hyphens, 1-64 chars. Anything else returns a 400 before hitting the DB.

## Files added

- `lib/data/takeaway.ts` — shared generators (380 lines)
- `app/api/v1/modules/[slug]/takeaway/route.ts` — endpoint (134 lines)

## Files modified

- `app/(marketing)/verify/page.tsx` — hero copy + metadata reframed for audit-anything
- `components/sections/verify/VerifyTool.tsx` — examples reordered; "signed" rendering expanded
- `components/sections/module-detail/DeploySection.tsx` — slimmed (397 → 122 lines) by extracting generators to shared module; download button now points at the real endpoint

## What this resolves

| Audit item | Status |
|---|---|
| Tier 3 — audit-your-own-image for arbitrary public images | ✅ Built (engine already supported it; UI/framing now reflects it) |
| Tier 2 — takeaway endpoint behind the CLI hint | ✅ Built |
| Roadmap promise: "audit-your-own-image (any registry)" — was "in progress" | ✅ Shipped |

Both items move from "considered/in-progress" on the public roadmap to "shipped." The next session will reflect this in `/roadmap`.

## What's next (Phase C)

Polish + marketing reconciliation. The items I queued earlier:

1. **Hero copy reconciliation** — landing hero is "VERIFIED CONTAINERS / PREVIEWED LIVE / DEPLOYED ON YOUR BOX." The marketplace + reviews + featured surfaces aren't represented. Decision: lean into "verified + curated" or stay on "verified."
2. **Named founder note** — proposal called it out specifically. About page is well-written but anonymous.
3. **Before/after narrative** — proposal Idea 4: side-by-side terminals showing "Docker Hub way" vs "Flareo way."
4. **Update /roadmap** to move shipped items into the right category (audit-any-image was "in progress," takeaway was implicit).

Probably one session for all four.
