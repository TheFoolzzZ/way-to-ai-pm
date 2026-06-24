// lib/session.ts
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export type SessionUser = { userId: string; username: string };

const COOKIE_NAME = "sb-session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const k =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Missing SUPABASE_SECRET_KEY");
  return k;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export async function createSession(user: SessionUser): Promise<void> {
  const payload = JSON.stringify(user);
  const value = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(payload) as Partial<SessionUser>;
    if (!parsed.userId || !parsed.username) return null;
    return { userId: parsed.userId, username: parsed.username };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
