import { NextResponse } from "next/server";
import { requestLoginCode } from "@/lib/auth/login";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await requestLoginCode(body.email ?? "");
  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "invalid_email"
          ? 400
          : 502;
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        ...(result.retryAfterSec != null
          ? { retryAfterSec: result.retryAfterSec }
          : {}),
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
