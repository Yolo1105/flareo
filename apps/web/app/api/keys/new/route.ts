import { NextRequest, NextResponse } from "next/server";
import { createApiKey } from "@/lib/db/queries";
import { auth } from "@/lib/auth/config";

interface NewKeyBody {
  label?: string;
  scopes?: string[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as NewKeyBody;
  if (!body.label || body.label.trim().length === 0) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const scopes =
    body.scopes && body.scopes.length > 0 ? body.scopes : ["modules:read"];

  const created = await createApiKey(session.user.id, body.label.trim(), scopes);
  return NextResponse.json(created, { status: 201 });
}
