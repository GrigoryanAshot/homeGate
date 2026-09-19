import { NextResponse } from "next/server";
import { requestLoginCode } from "@/lib/auth/login";
import { jsonWithCors, optionsCors } from "@/lib/api/cors";

export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return optionsCors(req);
}

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(req, { ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await requestLoginCode(body.email ?? "");
  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "invalid_email"
          ? 400
          : 502;
    return jsonWithCors(
      req,
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

  return jsonWithCors(req, {
    ok: true,
    email: result.email,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
