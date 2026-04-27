import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const updated = await markAllNotificationsRead(userId);
  return NextResponse.json({ updated });
}
