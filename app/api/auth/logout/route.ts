import { NextResponse } from "next/server";
import { withClearedSessionCookie } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return withClearedSessionCookie(res);
}
