import { NextResponse } from "next/server";

/** SoftAP captive portal is http://192.168.4.1 — browser calls our HTTPS API. */
export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  const allow =
    !origin ||
    origin === "null" ||
    origin.startsWith("http://192.168.4.") ||
    origin.startsWith("http://localhost") ||
    origin.includes("vercel.app") ||
    origin.includes("touchweb")
      ? origin && origin !== "null"
        ? origin
        : "*"
      : "*";

  return {
    "Access-Control-Allow-Origin": allow === "null" ? "*" : allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function jsonWithCors(
  req: Request,
  body: unknown,
  init?: { status?: number },
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: corsHeaders(req),
  });
}

export function optionsCors(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
