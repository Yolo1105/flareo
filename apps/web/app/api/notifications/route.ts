import { NextResponse } from "next/server";
import { listNotifications } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const notifications = await listNotifications(userId);
  return NextResponse.json({ notifications });
}
