import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await revokeApiKey(id, session.user.id);
  if (!ok) {
    return NextResponse.json(
      { error: "key not found or already revoked" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
