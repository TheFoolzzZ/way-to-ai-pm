// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ userId: session.userId, username: session.username });
}
