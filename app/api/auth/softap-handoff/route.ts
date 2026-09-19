import { NextResponse } from "next/server";
import { consumeSoftApHandoff } from "@/lib/db/provision";
import { withSessionCookie } from "@/lib/auth/server";

export const runtime = "nodejs";

/**
 * SoftAP finish → set session cookie → open app as that profile.
 * GET /api/auth/softap-handoff?t=...
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticket = url.searchParams.get("t")?.trim() ?? "";
  const appPath = "/smartgate-demo";

  const result = await consumeSoftApHandoff(ticket);
  if (!result.ok) {
    const res = NextResponse.redirect(new URL(appPath, url.origin));
    return res;
  }

  const res = NextResponse.redirect(new URL(appPath, url.origin));
  return withSessionCookie(res, result.user);
}
