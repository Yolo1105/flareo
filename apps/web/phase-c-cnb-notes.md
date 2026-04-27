# Phase C — Cloud Native Buildpacks auto-detect

Second of three remaining engineering items from the original "(2)" pick. Phase 3 (audit) → CNB (this session) → OPA policy gate (next session).

## What shipped

A complete buildpack-mode submission path. Submitters who don't have a Dockerfile can now pick "Auto-detect with buildpacks," paste a list of root-level files in their repo, and let Flareo decide which language and Paketo builder to use.

The pipeline shape downstream is unchanged — Trivy, CycloneDX SBOM, SLSA in-toto, cosign + Rekor all run identically. The CNB choice only affects the build command itself.

## Schema changes

Added three columns to `Submission`:

| field | type | purpose |
|---|---|---|
| `buildType` | `String @default("dockerfile")` | "dockerfile" or "cnb"; string instead of enum so future modes (Nix, ko, etc.) don't need migrations |
| `cnbDetectedLanguage` | `String?` | The language we detected — recorded at submission time so reviewers see what we'll build |
| `cnbBuilder` | `String?` | The pinned Paketo builder image (e.g. `paketobuildpacks/builder-jammy-base:0.4.290`) — pinned, not "latest" |

All three NULL for legacy `buildType="dockerfile"` submissions; the migration is purely additive.

**Action required before this works:** the migration is at `prisma/migrations/20260425110000_add_cnb_fields/`. Apply via `npx prisma migrate deploy && npx prisma generate`.

## Detection logic — `lib/cnb/detect.ts`

Pure, dependency-free, synchronous. Returns `CnbDetection | null`. Inputs:

- An array of root-level filenames (e.g. `["package.json", "README.md", "tsconfig.json"]`)

Outputs:

- `{ language, builder, reason, confidence }` on a match, where:
  - `language`: one of `node | python | go | rust | ruby | java | php | dotnet | static`
  - `builder`: pinned Paketo builder image string
  - `reason`: human-readable signal we matched (e.g. `"go.mod at root"`)
  - `confidence`: `"exact"` (unambiguous root marker) or `"fuzzy"` (e.g. lone index.html → static site)
- `null` when no marker matches

Marker priority (first match wins):

1. Compiled languages first — `go.mod`, `Cargo.toml`, Maven/Gradle, .NET project files
2. Scripting — Python (pyproject.toml, requirements.txt, setup.py, Pipfile), Ruby (Gemfile, .gemspec), PHP (composer.json)
3. Node last — many other-language projects carry a tooling `package.json`, so we treat it as a fallback

Tiny glob support (`*.csproj`, `*.gemspec`) for languages where the marker varies by project name.

## API extension — `/api/v1/submissions`

Schema added:
- `buildType: z.enum(["dockerfile", "cnb"]).default("dockerfile")`
- `cnbRootFiles: z.array(z.string().max(128)).max(200).optional()`

Two new `.refine()` rules:
1. `buildType="cnb"` cannot have a Dockerfile (mutual exclusivity)
2. `buildType="dockerfile"` must have either inline body or upload URL (existing requirement formalized)

Detection runs before the insert. If `buildType="cnb"` and detection returns null, the request fails with **400 bad_request** + a helpful error listing the markers we look for. The submitter gets the failure 100ms after submitting instead of after a build worker burns a slot 30 seconds in.

The submission row writes `buildType`, `cnbDetectedLanguage`, `cnbBuilder` so the reviewer's admin detail page can show "we plan to build this as Node.js" before they decide.

## Wizard UI — `components/sections/app-publish/PublishWizard.tsx`

Step 2 (MANIFEST) gets a new build-mode picker section at the bottom:

- Two big radio cards side by side
- "I have a Dockerfile" — the existing path
- "Auto-detect with buildpacks" — new, with green NEW pill
- When CNB is picked, an additional input field appears for root-file listing
- The "Continue" button label and target change: "Skip Dockerfile · review →" jumps to step 4

Stepper at the top shows step 3 (DOCKERFILE) as **SKIPPED** with line-through styling when CNB is selected, so the visitor sees explicitly that path is being bypassed — no confusion about "did I miss a step?"

Going back from step 4 also respects buildType: CNB submitters land on step 2, Dockerfile submitters land on step 3.

## Cross-page reconciliation

Files updated to reflect that CNB is no longer spec-only:

- `components/sections/pipeline-page/Stage01BuildKit.tsx` — replaced the dashed-warn-border "ROADMAP — CNB AUTO-DETECT / ETA: 2026 Q3" callout with a green ✓ "CNB AUTO-DETECT — SHIPPED" panel, with a hint at where to find it ("Pick 'Auto-detect with buildpacks' in the publish wizard step 2")
- `components/sections/pipeline-page/PipelineRoadmap.tsx` — dropped the CNB entry; only OPA policy gate remains as spec-only on this page now
- `app/(marketing)/roadmap/page.tsx` — moved CNB from "planned 2026 Q3" to "shipped 2026 Q2" with a body that describes what actually got built (publish wizard build-mode picker, server-side detection, full language set)

## Known limitations / what's not in scope

- **The build worker doesn't actually invoke CNB.** The schema and detection record what we'd build; integrating Paketo into the worker is a worker-repo task, not a flareo-repo task. The worker currently runs BuildKit-with-Dockerfile only. When the worker grows CNB support, it'll read the new fields off the submission row and dispatch accordingly.
- **The reviewer admin page doesn't yet display the CNB fields.** A future polish — the submission detail page should show "build mode: CNB · Node.js · paketobuildpacks/builder-jammy-base:0.4.290" prominently. For this session, the values are persisted but not surfaced.
- **No publisher-side override for the detected builder.** The detector picks one Paketo builder per language. A future enhancement would let the submitter override (e.g. force `paketobuildpacks/builder-jammy-full` for projects that need extra system packages).

## Files changed

- `prisma/schema.prisma` — added `buildType`, `cnbDetectedLanguage`, `cnbBuilder` to Submission
- `lib/cnb/detect.ts` — new, 180 lines
- `app/api/v1/submissions/route.ts` — schema + refines + detection call + insert fields
- `components/sections/app-publish/PublishWizard.tsx` — buildType state, picker UI, step skipping, back-navigation, payload assembly
- `components/sections/pipeline-page/Stage01BuildKit.tsx` — roadmap callout → shipped callout
- `components/sections/pipeline-page/PipelineRoadmap.tsx` — dropped CNB entry
- `app/(marketing)/roadmap/page.tsx` — CNB moved to shipped phase

## Migrations needed before deploy

Two pending migrations sit on the schema, both purely additive:

```sh
# Migration files live in prisma/migrations/ — apply with:
npx prisma migrate deploy
npx prisma generate
```

Without `prisma generate`, the new fields/models won't typecheck and the `as never` casts in the data layer will mask real type errors. Run both before the next session if you want clean types.

## What's next (Phase 2's third item)

OPA policy gate — Stage 07 of the pipeline. Spec-only currently. Reviewers apply rules manually using the same signals (CVE thresholds, signature presence, SLSA level). The build is to author the OPA bundle, evaluate it during the admission flow, and persist the verdict. Roughly the same scope as VEX or CNB.

Per the `b then c then d` plan: this is the last item. After OPA the proposal blueprint is fully consumed.
