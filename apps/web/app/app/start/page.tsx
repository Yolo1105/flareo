import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";

export const metadata: Metadata = {
  title: "Start here",
};

export const dynamic = "force-dynamic";

const CHOICES = [
  {
    num: "01",
    title: "Walk the pipeline",
    body: "Recorded republish of Vaultwarden — pin, copy, SBOM, scan, sign, catalog, verify. Same results every visit.",
    href: "/pipeline",
    cta: "Open walkthrough →",
    accent: true,
  },
  {
    num: "02",
    title: "Verify an image",
    body: "Paste any public OCI reference. Live cosign check plus catalog enrichment when the image is listed.",
    href: "/verify",
    cta: "Open verify tool →",
    accent: true,
  },
  {
    num: "03",
    title: "Browse the catalog",
    body: "Public module listings — trust scores, receipts, and digest-pinned compose files. No extra sign-in step.",
    href: "/catalog",
    cta: "Browse modules →",
    accent: false,
  },
  {
    num: "04",
    title: "Go to your dashboard",
    body: "Modules, jobs, and workspace metrics once you have something published.",
    href: "/app",
    cta: "Open dashboard →",
    accent: false,
  },
] as const;

/**
 * Post-login hub — pick pipeline, verify, catalog, or dashboard.
 * Default landing after GitHub sign-in when no callbackUrl is set.
 */
export default async function StartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const displayName =
    session.user.name ??
    session.user.email?.split("@")[0] ??
    "there";

  return (
    <>
      <ViewHeader
        eyebrow="START HERE"
        title={`You're signed in, ${displayName}.`}
        subtitle="Choose what you want to do. Pipeline and verify are the interactive demos; catalog and docs stay public."
      />

      <section className="grid grid-cols-1 gap-px border-b border-hairline bg-hairline lg:grid-cols-2">
        {CHOICES.map((c) => (
          <Link
            key={c.num}
            href={c.href}
            className="group flex flex-col bg-canvas-deep p-7 transition-colors hover:bg-canvas-panel"
          >
            <div
              className={`mb-2 font-mono text-[10px] tracking-[0.14em] ${
                c.accent ? "text-accent" : "text-ink-ghost"
              }`}
            >
              {c.num}
            </div>
            <h2 className="mb-2 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink group-hover:text-accent">
              {c.title}
            </h2>
            <p className="mb-5 flex-1 font-body text-[13.5px] leading-[1.55] text-ink-softer">
              {c.body}
            </p>
            <span className="font-mono text-[11px] text-accent">{c.cta}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
