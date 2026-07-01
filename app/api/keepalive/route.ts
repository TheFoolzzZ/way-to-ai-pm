// Cron heartbeat: pings Supabase once a day so the free-tier project
// is not paused for inactivity (7-day threshold). Called by Vercel Cron.
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "no-server-client" }, { status: 500 });
  }

  // A real DB round-trip counts as incoming API activity for Supabase.
  const { error } = await supabase.from("questions").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
