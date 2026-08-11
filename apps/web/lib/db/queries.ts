/**
 * Database query layer.
 *
 * Every helper in here replaces a function that used to live in the old
 * lib/db/sqlite.ts. The signatures match so API route handlers do not
 * change shape. All functions return the public domain types defined in
 * lib/types rather than raw Prisma rows, which keeps the route handlers
 * free of Prisma imports.
 */

import crypto from "node:crypto";
import { hasDatabaseUrl } from "@/lib/config/env";
import { prisma } from "./prisma";
import type {
  ApiKey,
  NotificationItem,
  NotificationKind,
  Job,
  JobStatus,
  Module,
} from "@/lib/types";

// ─── API keys ───────────────────────────────────────────────────────

interface ApiKeyShape {
  id: string;
  label: string;
  tokenHash: string;
  tokenMask: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  scopesJson: string;
  userId: string | null;
  revoked: boolean;
}

function shapeToApiKey(r: ApiKeyShape): ApiKey {
  return {
    id: r.id,
    label: r.label,
    maskedToken: r.tokenMask,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
    scopes: JSON.parse(r.scopesJson) as string[],
  };
}

export async function listApiKeys(userId: string | null): Promise<ApiKey[]> {
  const rows = (await prisma.apiKey.findMany({
    where: userId ? { userId, revoked: false } : { revoked: false },
    orderBy: { createdAt: "desc" },
  })) as ApiKeyShape[];
  return rows.map(shapeToApiKey);
}

export async function createApiKey(
  userId: string | null,
  label: string,
  scopes: string[]
): Promise<{ key: ApiKey; fullToken: string }> {
  const id = `key-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const raw =
    "fla_" +
    crypto.randomBytes(24).toString("base64url").replace(/[_-]/g, "").slice(0, 32);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const mask = `fla_${"\u2022".repeat(14)}${raw.slice(-4)}`;

  const row = (await prisma.apiKey.create({
    data: {
      id,
      userId,
      label,
      tokenHash: hash,
      tokenMask: mask,
      scopesJson: JSON.stringify(scopes),
    },
  })) as ApiKeyShape;

  return {
    key: shapeToApiKey(row),
    fullToken: raw,
  };
}

export async function revokeApiKey(
  id: string,
  userId: string | null
): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: userId ? { id, userId, revoked: false } : { id, revoked: false },
    data: { revoked: true },
  });
  return (result as { count: number }).count > 0;
}

// ─── Notifications ──────────────────────────────────────────────────

interface NotificationShape {
  id: string;
  userId: string | null;
  kind: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string | null;
}

function shapeToNotification(r: NotificationShape): NotificationItem {
  return {
    id: r.id,
    kind: r.kind as NotificationKind,
    title: r.title,
    body: r.body,
    at: r.at,
    read: r.read,
    href: r.href ?? undefined,
  };
}

export async function listNotifications(
  userId: string | null
): Promise<NotificationItem[]> {
  const rows = (await prisma.notification.findMany({
    where: userId ? { OR: [{ userId }, { userId: null }] } : { userId: null },
    orderBy: { createdAt: "desc" },
  })) as NotificationShape[];
  return rows.map(shapeToNotification);
}

export async function markAllNotificationsRead(
  userId: string | null
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: userId
      ? { OR: [{ userId }, { userId: null }], read: false }
      : { userId: null, read: false },
    data: { read: true },
  });
  return (result as { count: number }).count;
}

export async function markNotificationRead(
  id: string,
  _userId: string | null
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id },
    data: { read: true },
  });
  return (result as { count: number }).count > 0;
}

// ─── Jobs ───────────────────────────────────────────────────────────

interface JobShape {
  id: string;
  userId: string | null;
  moduleSlug: string;
  moduleName: string;
  version: string;
  status: string;
  startedAt: Date;
  currentStage: number;
  percent: number;
  stagesJson: string;
}

function shapeToJob(r: JobShape): Job {
  return {
    id: r.id,
    moduleSlug: r.moduleSlug,
    moduleName: r.moduleName,
    version: r.version,
    status: r.status as JobStatus,
    startedAt: r.startedAt.toISOString(),
    currentStage: r.currentStage,
    percent: r.percent,
    stages: JSON.parse(r.stagesJson) as Job["stages"],
  };
}

export async function listJobs(userId: string | null): Promise<Job[]> {
  const rows = (await prisma.job.findMany({
    where: userId ? { OR: [{ userId }, { userId: null }] } : {},
    orderBy: { startedAt: "desc" },
  })) as JobShape[];
  return rows.map(shapeToJob);
}

export async function getJob(id: string): Promise<Job | null> {
  const row = (await prisma.job.findUnique({ where: { id } })) as JobShape | null;
  if (!row) return null;
  return shapeToJob(row);
}

export async function createJob(args: {
  userId: string | null;
  moduleSlug: string;
  moduleName: string;
  version: string;
}): Promise<Job> {
  const id = String(Math.floor(Math.random() * 9000) + 1000);
  const stages = [
    { name: "submit", status: "queued" as const, durationMs: null },
    { name: "build", status: "queued" as const, durationMs: null },
    { name: "scan", status: "queued" as const, durationMs: null },
    { name: "attest", status: "queued" as const, durationMs: null },
    { name: "sign", status: "queued" as const, durationMs: null },
    { name: "publish", status: "queued" as const, durationMs: null },
  ];
  const row = (await prisma.job.create({
    data: {
      id,
      userId: args.userId,
      moduleSlug: args.moduleSlug,
      moduleName: args.moduleName,
      version: args.version,
      status: "queued",
      startedAt: new Date(),
      currentStage: 0,
      percent: 0,
      stagesJson: JSON.stringify(stages),
    },
  })) as JobShape;
  return shapeToJob(row);
}

// ─── Modules ────────────────────────────────────────────────────────

export interface ModuleShape {
  id: string;
  slug: string;
  name: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
  category: string;
  status: string;
  slsa: string | null;
  trust: number;
  trustVulns: number;
  trustSlsa: number; // provenance score (column name retained)
  trustSignature: number;
  trustSbom: number;
  cveCritical: number;
  cveHigh: number;
  cveMedium: number;
  cveLow: number;
  deploys: number;
  updatedHours: number;
  size: string;
  digest: string;
  previewable: boolean;
  visibility: string;
  pulls30d: number;
  building: boolean;
  lastRebuiltAt: Date | null;
}

export function shapeToModule(r: ModuleShape): Module {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    version: r.version,
    author: r.author,
    description: r.description,
    tags: r.tags,
    category: r.category as Module["category"],
    status: r.status as Module["status"],
    slsa: (r.slsa as Module["slsa"]) ?? null,
    trust: r.trust,
    trustBreakdown: {
      vulns: r.trustVulns,
      // trustSlsa column stores the provenance signal (renamed; no migration)
      provenance: r.trustSlsa,
      signature: r.trustSignature,
      sbom: r.trustSbom,
    },
    cves: {
      critical: r.cveCritical,
      high: r.cveHigh,
      medium: r.cveMedium,
      low: r.cveLow,
    },
    deploys: r.deploys,
    updatedHours: r.updatedHours,
    size: r.size,
    digest: r.digest,
    previewable: r.previewable,
    visibility: (r.visibility === "private" ? "private" : "public") as Module["visibility"],
    pulls30d: r.pulls30d,
    building: r.building,
    lastRebuiltAt: r.lastRebuiltAt ? r.lastRebuiltAt.toISOString() : null,
  };
}

export async function listModules(): Promise<Module[]> {
  const rows = (await prisma.module.findMany({
    orderBy: { trust: "desc" },
  })) as ModuleShape[];
  return rows.map(shapeToModule);
}

/**
 * List the modules published by a specific user. Used by the /app
 * dashboard and /app/modules. Returns an empty array if the user
 * hasn't published anything yet — the page should render a zero
 * state in that case rather than looking broken.
 */
export async function listMyModules(userId: string): Promise<Module[]> {
  const rows = (await prisma.module.findMany({
    where: { publisherId: userId },
    orderBy: { updatedAt: "desc" },
  })) as ModuleShape[];
  return rows.map(shapeToModule);
}

export async function getModuleBySlug(slug: string): Promise<Module | null> {
  if (!hasDatabaseUrl()) return null;
  const row = (await prisma.module.findUnique({
    where: { slug },
    include: {
      publisher: { select: { username: true } },
    } as never,
  })) as (ModuleShape & { publisher: { username: string | null } | null }) | null;
  if (!row) return null;
  const base = shapeToModule(row);
  return { ...base, publisherUsername: row.publisher?.username ?? null };
}

/**
 * Cheap existence check + visibility lookup for module slugs.
 *
 * Used by endpoints that need to verify a slug exists before doing
 * something else (creating a review, filing a report, evaluating
 * VEX) without paying for the full module row. Returns null if the
 * module doesn't exist; returns just the slug + visibility otherwise.
 *
 * If you need more fields, use getModuleBySlug() for the full shape
 * or write a narrow `prisma.module.findUnique({select: ...})` for a
 * specific subset.
 */
export async function moduleExistsBySlug(
  slug: string,
): Promise<{ slug: string; visibility: string } | null> {
  if (!hasDatabaseUrl()) return null;
  const row = (await prisma.module.findUnique({
    where: { slug } as never,
    select: { slug: true, visibility: true } as never,
  })) as { slug: string; visibility: string } | null;
  return row;
}
