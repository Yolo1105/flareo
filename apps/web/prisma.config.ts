import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (replaces `package.json#prisma` — deprecated
 * ahead of Prisma 7). Paths are relative to this file (apps/web/).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
