// app/api/auth/unlock/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server-supabase";
import { createSession } from "@/lib/session";

type UnlockBody = { token?: string; username?: string };

export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "UNKNOWN_ERROR" }, { status: 500 });
  }

  let body: UnlockBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const token = body.token?.trim();
  const username = body.username?.trim();
  if (!token || !username) {
    return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const { data: existingUser, error: queryError } = await supabase
    .from("system_users")
    .select("id, access_token, username, is_active")
    .eq("access_token", token)
    .maybeSingle();

  if (queryError) {
    return NextResponse.json({ success: false, error: "UNKNOWN_ERROR" }, { status: 500 });
  }
  if (!existingUser || !existingUser.is_active) {
    return NextResponse.json({ success: false, error: "TOKEN_NOT_FOUND" }, { status: 404 });
  }
  if (existingUser.username && existingUser.username !== username) {
    return NextResponse.json({ success: false, error: "TOKEN_ALREADY_BOUND" }, { status: 409 });
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from("system_users")
    .update({ username, last_login_at: new Date().toISOString() })
    .eq("id", existingUser.id)
    .select("id, username")
    .single();

  if (updateError || !updatedUser) {
    return NextResponse.json({ success: false, error: "UNKNOWN_ERROR" }, { status: 500 });
  }

  await createSession({ userId: updatedUser.id, username: updatedUser.username });

  return NextResponse.json({ success: true, user: updatedUser });
}
