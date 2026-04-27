/**
 * SPECULATIVE — see decisions.md G-1.
 *
 * Preview allocator interface. The contract is "give me a running
 * instance of module X for user Y, return an addressable URL." The
 * substrate behind the contract is intentionally pluggable —
 * Firecracker, Fly.io machines, Kata Containers, whatever wins
 * the F2 substrate decision.
 *
 * The current implementation is a STUB that doesn't actually
 * launch anything. It returns mock instance refs so the UI surface
 * can be built and tested. The stub is sufficient for F1 (gated
 * scaffold); F2 swaps the real allocator in.
 *
 * Why this scaffold exists before F0 data fired:
 *   - User asked for it explicitly, acknowledged speculative.
 *   - Schema, allocator contract, and UI surface can ship without
 *     a real substrate.
 *   - When F0 says "yes build F1," only the allocator implementation
 *     needs replacing — everything else is in place.
 *
 * If F0 says "no," delete this file along with the schema additions
 * for PreviewInstance.
 */

export interface PreviewAllocationRequest {
  userId: string;
  moduleSlug: string;
  /** Module's current pinned digest. Allocator pulls this image. */
  digest: string;
  /** Container port to map (typically 8080). */
  containerPort: number;
}

export interface PreviewAllocation {
  /** Provider's instance ID (Fly machine ID, Firecracker socket, etc.). */
  hostId: string;
  /** User-facing subdomain — full URL is `https://<subdomain>`. */
  subdomain: string;
  /** TTL seconds — when the instance auto-expires. */
  ttlSeconds: number;
}

export type AllocationResult =
  | { ok: true; allocation: PreviewAllocation }
  | { ok: false; reason: AllocationFailure; message: string };

export type AllocationFailure =
  | "quota_exceeded"
  | "module_not_previewable"
  | "substrate_unavailable"
  | "module_image_not_found"
  | "internal_error";

export interface Allocator {
  /**
   * Allocate a new preview instance. Returns once the instance is
   * accepting connections. The deadline is roughly 60 seconds for
   * real substrates; the stub returns immediately.
   */
  allocate(req: PreviewAllocationRequest): Promise<AllocationResult>;

  /**
   * Tear down an existing instance. Idempotent — calling on an
   * already-destroyed instance returns ok=true.
   */
  destroy(hostId: string): Promise<{ ok: boolean; error?: string }>;

  /**
   * Health check — used by admin diagnostics to confirm the
   * substrate is reachable.
   */
  ping(): Promise<{ ok: boolean; latencyMs?: number; error?: string }>;
}

// ─── stub implementation ────────────────────────────────────────────

/**
 * Stub allocator. Returns mock URLs without launching anything. Used
 * during F1 development before a real substrate is wired up.
 *
 * The mock URLs follow the pattern that real implementations should
 * use: `<short-id>-<slug>.preview.flareo.dev`. This lets the rest of
 * the UI work end-to-end (the URL is shown to users, copied, etc.)
 * without the URL actually resolving.
 */
export class StubAllocator implements Allocator {
  async allocate(
    req: PreviewAllocationRequest,
  ): Promise<AllocationResult> {
    const shortId = Math.random().toString(36).slice(2, 8);
    const allocation: PreviewAllocation = {
      hostId: `stub-${shortId}-${req.moduleSlug}`,
      subdomain: `${shortId}-${req.moduleSlug}.preview.flareo.dev`,
      ttlSeconds: 3600,
    };
    // Simulate a brief allocation delay so UI loading states are
    // exercised in dev. 200ms is short enough not to be annoying.
    await new Promise((r) => setTimeout(r, 200));
    return { ok: true, allocation };
  }

  async destroy(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async ping(): Promise<{ ok: boolean; latencyMs?: number }> {
    return { ok: true, latencyMs: 0 };
  }
}

// Singleton — swap to a real Allocator implementation when F2 fires.
export const allocator: Allocator = new StubAllocator();
