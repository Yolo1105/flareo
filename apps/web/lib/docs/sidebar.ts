/**
 * The docs sidebar structure. Single source of truth: adding a page
 * means adding an entry here and creating the matching page.mdx file.
 *
 * `slug` is the URL path (without the leading /docs). `title` is what
 * appears in the sidebar. `description` is optional flavor text shown
 * on the `/docs` index page.
 */

export interface DocsPage {
  slug: string;
  title: string;
  description?: string;
}

export interface DocsSection {
  title: string;
  pages: DocsPage[];
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    title: "Getting started",
    pages: [
      {
        slug: "/docs",
        title: "Overview",
        description: "What Flareo is and what it isn't.",
      },
      {
        slug: "/docs/install",
        title: "Install the CLI",
        description: "curl-pipe installer, plus manual download options.",
      },
      {
        slug: "/docs/first-verify",
        title: "Verify your first module",
        description: "Five-minute walkthrough from zero to a verified container.",
      },
    ],
  },
  {
    title: "Using Flareo",
    pages: [
      {
        slug: "/docs/catalog",
        title: "Browse the catalog",
        description: "How to find, filter, and evaluate modules.",
      },
      {
        slug: "/docs/verify",
        title: "Verify any container",
        description: "What the verify tool actually checks.",
      },
      {
        slug: "/docs/pull-run",
        title: "Pull and run",
        description: "From a verified digest to a running container.",
      },
      {
        slug: "/docs/run",
        title: "Run a module ephemerally",
        description: "flareo run — local test with auto-teardown.",
      },
      {
        slug: "/docs/compose",
        title: "Generate compose files",
        description: "Using flareo compose to produce pinned docker-compose.yaml.",
      },
      {
        slug: "/docs/previews",
        title: "Shared preview demos",
        description: "Click-to-try without installing anything.",
      },
    ],
  },
  {
    title: "Use cases",
    pages: [
      {
        slug: "/docs/uses/vaultwarden",
        title: "Deploy Vaultwarden in 5 minutes",
        description: "End-to-end walkthrough of a verified self-hosted password manager.",
      },
      {
        slug: "/docs/uses/replacing-docker-hub",
        title: "Replacing Docker Hub in a homelab",
        description: "Migrating a Portainer or Compose setup to signed-only pulls.",
      },
      {
        slug: "/docs/uses/ci-cd",
        title: "Verify images in CI/CD",
        description: "Gate GitHub Actions and Argo CD deploys on Flareo signatures.",
      },
    ],
  },
  {
    title: "Publishing",
    pages: [
      {
        slug: "/docs/publishing",
        title: "Publishing a module",
        description: "How to submit a module to the Flareo catalog.",
      },
      {
        slug: "/docs/submitting-dockerfiles",
        title: "Submitting a Dockerfile",
        description: "How to write a Dockerfile the build worker will accept.",
      },
      {
        slug: "/docs/good-module",
        title: "Writing a good module",
        description: "What we look for when reviewing submissions.",
      },
      {
        slug: "/docs/review-timelines",
        title: "Review timelines",
        description: "What happens between submit and publish.",
      },
    ],
  },
  {
    title: "Security",
    pages: [
      {
        slug: "/docs/threat-model",
        title: "Threat model",
        description: "What Flareo defends against and what it doesn't.",
      },
      {
        slug: "/docs/trust-score",
        title: "Trust Score methodology",
        description: "How the 0-100 number is computed, signal by signal.",
      },
      {
        slug: "/docs/vex",
        title: "VEX (vulnerability exploitability)",
        description:
          "How the reviewer team annotates Trivy findings as exploitable or not, and how scanners consume it.",
      },
      {
        slug: "/docs/signing",
        title: "How we sign modules",
        description: "cosign keyless, Fulcio, Rekor, SLSA status.",
      },
      {
        slug: "/docs/verify-cli",
        title: "Verify from the CLI",
        description: "Run the same checks the website runs.",
      },
      {
        slug: "/docs/admission",
        title: "Admission policies",
        description: "Enforce Flareo signatures at Kubernetes admission.",
      },
    ],
  },
  {
    title: "Reference",
    pages: [
      {
        slug: "/docs/cli-reference",
        title: "CLI reference",
        description: "Every flareo subcommand, with examples.",
      },
      {
        slug: "/docs/api-reference",
        title: "API reference",
        description: "Every /api/v1 endpoint.",
      },
      {
        slug: "/docs/glossary",
        title: "Glossary",
        description: "SBOM, SLSA, Sigstore, Rekor, and the rest.",
      },
    ],
  },
];

/** Flattened list of all pages, in the order they appear in the sidebar.
 *  Used by the prev/next pager at the bottom of each page. */
export const ALL_PAGES: DocsPage[] = DOCS_SECTIONS.flatMap((s) => s.pages);

/** Look up the section title for a given slug. */
export function sectionForSlug(slug: string): string | undefined {
  return DOCS_SECTIONS.find((s) => s.pages.some((p) => p.slug === slug))?.title;
}

/** Prev / next neighbors for the page with this slug. */
export function neighbors(slug: string): { prev?: DocsPage; next?: DocsPage } {
  const idx = ALL_PAGES.findIndex((p) => p.slug === slug);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? ALL_PAGES[idx - 1] : undefined,
    next: idx < ALL_PAGES.length - 1 ? ALL_PAGES[idx + 1] : undefined,
  };
}
