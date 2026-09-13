import { NextResponse } from "next/server";
import { verifyLoginCode } from "@/lib/auth/login";
import { setSessionCookie } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await verifyLoginCode(body.email ?? "", body.code ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 },
    );
  }

  await setSessionCookie(result.user);

  return NextResponse.json({ ok: true, user: result.user });
}
