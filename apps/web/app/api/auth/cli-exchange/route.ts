import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation/schemas";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * POST /api/auth/cli-exchange
 *
 * Called by `flareo login` after the user completes GitHub device-code
 * auth. Takes the GitHub access token, verifies it with GitHub, looks
 * up or creates the corresponding Flareo user, mints a fresh API key
 * scoped to that user, and returns the raw token.
 *
 * Body:
 *   { github_access_token: string, label: string }
 *
 * Returns:
 *   { flareo_token: "fla_<hex>", user_handle: "octocat" }
 *
 * Security notes:
 *   - We NEVER store the GitHub access token. It's used once to identify
 *     the user and is discarded.
 *   - The Flareo token returned here is the ONLY time it is revealed in
 *     plaintext anywhere. We store only its sha256 hash in the ApiKey
 *     table. Users can revoke keys from /app/admin/api-keys.
 *   - The endpoint is not rate limited because GitHub already rate
 *     limits the device-code flow; extra limiting would just add
 *     friction without safety benefit.
 */

export const runtime = "nodejs";

const ExchangeSchema = z.object({
  github_access_token: z.string().min(10).max(300),
  label: z.string().min(1).max(100).default("flareo cli"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(apiError("bad_json", "body must be JSON"), {
      status: 400,
    });
  }

  const parsed = ExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError("bad_request", "invalid body", parsed.error.issues), {
      status: 400,
    });
  }

  // ─── verify the GitHub token by asking GitHub who it belongs to ───
  let gh: { login: string; id: number; name: string | null; email: string | null };
  try {
    const resp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${parsed.data.github_access_token}`,
        "User-Agent": "flareo-cli-exchange",
        Accept: "application/vnd.github+json",
      },
    });
    if (!resp.ok) {
      return NextResponse.json(
        apiError("github_rejected", "GitHub rejected the token"),
        { status: 401 }
      );
    }
    gh = (await resp.json()) as typeof gh;
  } catch {
    return NextResponse.json(
      apiError("github_unreachable", "could not reach GitHub"),
      { status: 502 }
    );
  }

  // GitHub may return `email: null` if the user has hidden it. Fall
  // back to the `user/emails` endpoint if needed.
  let primaryEmail = gh.email;
  if (!primaryEmail) {
    try {
      const er = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${parsed.data.github_access_token}`,
          "User-Agent": "flareo-cli-exchange",
          Accept: "application/vnd.github+json",
        },
      });
      if (er.ok) {
        const emails = (await er.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primary = emails.find((e) => e.primary && e.verified);
        primaryEmail = primary?.email ?? null;
      }
    } catch {
      // non-fatal; we'll create the user without an email
    }
  }

  // ─── upsert the user ───
  // NextAuth's existing schema keys users by email. If we have one, use it;
  // otherwise key by GitHub provider account id via the Account table.
  type UserRow = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  let user: UserRow | null = null;

  if (primaryEmail) {
    user = (await prisma.user.upsert({
      where: { email: primaryEmail },
      update: {
        name: gh.name ?? gh.login,
      },
      create: {
        email: primaryEmail,
        name: gh.name ?? gh.login,
        role: "user",
      },
    })) as UserRow;
  } else {
    // Look up by existing Account row for this GH id.
    const existing = (await prisma.account.findFirst({
      where: {
        provider: "github",
        providerAccountId: String(gh.id),
      },
    })) as { userId: string } | null;
    if (existing) {
      user = (await prisma.user.findUnique({
        where: { id: existing.userId },
      })) as UserRow | null;
    }
    if (!user) {
      user = (await prisma.user.create({
        data: {
          name: gh.name ?? gh.login,
          role: "user",
        },
      })) as UserRow;
    }
  }

  if (!user) {
    return NextResponse.json(
      apiError("user_create_failed", "could not resolve user"),
      { status: 500 }
    );
  }
  const userRow: UserRow = user;

  // ─── mint a fresh API key ───
  // Format: fla_ + 48 hex chars. Entropy: 192 bits, plenty.
  const rawSuffix = randomBytes(24).toString("hex");
  const rawToken = `fla_${rawSuffix}`;
  const hash = createHash("sha256").update(rawToken).digest("hex");
  const mask = `fla_••••••••${rawSuffix.slice(-4)}`;

  const keyId = `apikey_${randomBytes(8).toString("hex")}`;
  await prisma.apiKey.create({
    data: {
      id: keyId,
      userId: userRow.id,
      label: parsed.data.label,
      tokenHash: hash,
      tokenMask: mask,
      // Scope JSON stored as a string per existing schema.
      scopesJson: JSON.stringify(["read:catalog", "read:profile"]),
      revoked: false,
    },
  });

  return NextResponse.json(
    {
      flareo_token: rawToken,
      user_handle: gh.login,
      user_id: userRow.id,
    },
    { status: 200 }
  );
}
