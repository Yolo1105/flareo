import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In development Next reloads modules on every file change, which would
 * otherwise spawn a new PrismaClient on every reload and exhaust database
 * connections. The globalThis cache dodges that. In production a fresh
 * process gets a fresh client, as intended.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
