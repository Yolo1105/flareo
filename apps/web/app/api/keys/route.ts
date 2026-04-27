import { NextResponse } from "next/server";
import { listApiKeys } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const keys = await listApiKeys(session.user.id);
  return NextResponse.json({ keys });
}
