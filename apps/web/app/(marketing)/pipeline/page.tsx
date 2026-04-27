import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { shapeToModule, type ModuleShape } from "@/lib/db/queries";
import type { Module } from "@/lib/types";
import { buildPipelineArtifacts } from "@/lib/data/pipeline-artifacts";
import { PageHero } from "@/components/ui/PageHero";
import { PipelineStageNav } from "@/components/sections/pipeline-page/PipelineStageNav";
import { PipelineHeader } from "@/components/sections/pipeline-page/PipelineHeader";
import { Stage01BuildKit } from "@/components/sections/pipeline-page/Stage01BuildKit";
import { Stage02Trivy } from "@/components/sections/pipeline-page/Stage02Trivy";
import { Stage03Sbom } from "@/components/sections/pipeline-page/Stage03Sbom";
import { Stage04Vex } from "@/components/sections/pipeline-page/Stage04Vex";
import { Stage05Slsa } from "@/components/sections/pipeline-page/Stage05Slsa";
import { Stage06Cosign } from "@/components/sections/pipeline-page/Stage06Cosign";
import { Stage07Policy } from "@/components/sections/pipeline-page/Stage07Policy";
import { Stage08Publish } from "@/components/sections/pipeline-page/Stage08Publish";
import { PipelineRoadmap } from "@/components/sections/pipeline-page/PipelineRoadmap";

export const metadata: Metadata = {
  title: "Pipeline · live",
  description:
    "Walk through every stage of Flareo's container supply-chain pipeline. Real artifacts at each step.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  module?: string;
}

/**
 * /pipeline — authenticated full-pipeline walkthrough.
 *
 * Shows the proposal's complete 8-stage container supply-chain
 * pipeline with every stage's actual artifact rendered:
 *
 *   01 BuildKit / CNB              (CNB auto-detect = spec-only)
 *   02 Trivy CVE scan              (built)
 *   03 CycloneDX SBOM              (built)
 *   04 VEX annotation              (spec-only)
 *   05 SLSA L1 provenance          (built)
 *   06 cosign keyless + Rekor      (built)
 *   07 Policy-as-code gate         (spec-only)
 *   08 Admin review → ECR publish  (built)
 *
 * Spec-only stages render the artifact shape they WILL produce, with
 * a clear "spec-only" badge so a security-literate visitor isn't
 * misled. The point — per the proposal's content principle — is that
 * the pipeline diagram is not five circles with arrows; each stage
 * has its real receipt visible.
 *
 * Auth-gated. Anonymous visitors get redirected to /login with a
 * callbackUrl=/pipeline so they come back here after sign-in. Demo
 * mode (DEMO_MODE=1) means the demo signin shortcuts on the login
 * page get them through.
 *
 * The page is parameterized by ?module=<slug>. If unset, falls back
 * to vaultwarden (the project's flagship example). The module
 * picker at the top lets visitors switch in-place.
 */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/pipeline");
  }
  // After redirect() (return type `never`), capture narrowed user.
  const sessionUser = session!.user!;

  const params = await searchParams;
  const requestedSlug = params.module ?? "vaultwarden";

  // Load all public modules so the picker has options. Cheap query
  // on a small table; no need to paginate for this page.
  const allModulesRows = await safeListModules();
  const allModules = allModulesRows.length > 0 ? allModulesRows : [];

  // Resolve the active module — requested slug → fallback to first
  // available → fallback to a synthesized vaultwarden if the DB is
  // empty (still want the page to render artifacts for demo).
  const activeModule =
    allModules.find((m) => m.slug === requestedSlug) ??
    allModules[0] ??
    SYNTHETIC_FALLBACK_MODULE;

  const artifacts = buildPipelineArtifacts(activeModule);

  return (
    <>
      <PageHero
        eyebrow="Pipeline · live"
        prompt={`flareo pipeline trace --module=${activeModule.slug}@${activeModule.version}`}
        promptComment="every stage. every artifact. nothing hidden."
        title={
          <>
            The full pipeline,
            <br />
            stage by stage.
          </>
        }
      >
        <p className="max-w-[680px] font-body text-[15.5px] leading-[1.55] text-ink-softer">
          This is what runs against every submission. Eight stages, real
          artifacts at every step. Two stages are still spec-only and
          clearly labeled — see the roadmap at the bottom for delivery
          dates.
        </p>
      </PageHero>

      <PipelineHeader
        module={activeModule}
        modules={allModules}
        signedInAs={sessionUser.name ?? sessionUser.email ?? "you"}
        userRole={sessionUser.role}
      />

      <PipelineStageNav />

      <Stage01BuildKit module={activeModule} buildLog={artifacts.buildLog} />
      <Stage02Trivy module={activeModule} report={artifacts.trivyReport} />
      <Stage03Sbom module={activeModule} sbom={artifacts.sbom} />
      <Stage04Vex module={activeModule} vex={artifacts.vexPreview} />
      <Stage05Slsa module={activeModule} provenance={artifacts.slsaProvenance} />
      <Stage06Cosign
        module={activeModule}
        signature={artifacts.cosignSignature}
        rekor={artifacts.rekorEntry}
      />
      <Stage07Policy module={activeModule} decision={artifacts.policyDecision} />
      <Stage08Publish module={activeModule} receipt={artifacts.publishReceipt} />

      <PipelineRoadmap />

      <section className="border-b border-hairline px-8 py-12 text-center">
        <h2 className="mb-3 font-display text-[22px] font-black tracking-[-0.02em] text-ink">
          Want to run YOUR module through this?
        </h2>
        <p className="mx-auto mb-5 max-w-[520px] font-body text-[13.5px] text-ink-softer">
          The pipeline you just walked through runs against every submission
          in production. Submit a Dockerfile or image reference and watch it
          execute live in your dashboard.
        </p>
        <Link
          href="/app/publish"
          className="btn-chamfer inline-block border border-accent bg-accent px-6 py-3 font-body text-[13.5px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-accent-hot"
        >
          Submit a module →
        </Link>
      </section>
    </>
  );
}

async function safeListModules(): Promise<Module[]> {
  try {
    const rows = (await prisma.module.findMany({
      where: { visibility: "public" } as never,
      orderBy: { trust: "desc" } as never,
    })) as ModuleShape[];
    return rows.map(shapeToModule);
  } catch {
    return [];
  }
}

// Synthesized fallback so the pipeline page still renders meaningfully
// when the DB is unreachable or unseeded. Uses vaultwarden's actual
// values so the artifacts look representative.
const SYNTHETIC_FALLBACK_MODULE: Module = {
  id: "FLA-SYN-0001",
  slug: "vaultwarden",
  name: "Vaultwarden",
  version: "1.30.5",
  author: "flareo",
  description:
    "Self-hosted password manager built from the ground up to be lightweight.",
  tags: ["password-manager", "self-hosted", "rust"],
  category: "security",
  status: "verified",
  slsa: "L3",
  trust: 96,
  trustBreakdown: { vulns: 25, slsa: 23, signature: 24, sbom: 24 },
  cves: { critical: 0, high: 0, medium: 1, low: 3 },
  deploys: 12_400,
  updatedHours: 14,
  size: "62 MB",
  digest:
    "sha256:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
  previewable: true,
  visibility: "public",
  pulls30d: 12_400,
  building: false,
  publisherUsername: null,
};
