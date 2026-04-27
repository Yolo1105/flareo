/**
 * Shared auth helper for worker-callback endpoints.
 *
 * The build worker calls back to the main app for two things —
 * marking a submission as built/failed, and asking for a policy
 * verdict. Both endpoints authenticate the same way: a shared
 * secret in the `x-worker-secret` header that has to match the
 * `FLAREO_WORKER_SECRET` env var.
 *
 * Until this helper existed, that same 12 lines of auth check was
 * duplicated in both endpoints. Forgetting it on a third worker
 * endpoint would expose an unauthenticated callback. Centralizing
 * here means new endpoints get auth by writing one line.
 *
 * Returns null on success (caller proceeds with request handling).
 * Returns a NextResponse on failure that the caller should return
 * directly — the response carries the right status (500 for missing
 * env, 401 for missing/wrong header) and an apiError body.
 */
import { NextResponse } from "next/server";
import { apiError } from "@/lib/validation/schemas";

export function verifyWorkerSecret(
  req: Request,
  /** Endpoint name for logging the misconfig. */
  endpoint: string,
): NextResponse | null {
  const expected = process.env.FLAREO_WORKER_SECRET;
  if (!expected) {
    console.error(`[${endpoint}] FLAREO_WORKER_SECRET not set`);
    return NextResponse.json(
      apiError("misconfigured", "worker integration not configured"),
      { status: 500 },
    );
  }

  const provided = req.headers.get("x-worker-secret");
  if (!provided || provided !== expected) {
    return NextResponse.json(
      apiError("unauthenticated", "worker secret missing or wrong"),
      { status: 401 },
    );
  }

  return null;
}
