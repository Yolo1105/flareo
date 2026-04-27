/**
 * NextAuth.js v5 catch-all route.
 * Mounts the handlers produced by the config in lib/auth/config.ts
 * at the /api/auth/* path that Auth.js expects.
 */

import { handlers } from "@/lib/auth/config";
export const { GET, POST } = handlers;
export const runtime = "nodejs";
