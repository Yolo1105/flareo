import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id } = await ctx.params;
  const ok = await markNotificationRead(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "notification not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
