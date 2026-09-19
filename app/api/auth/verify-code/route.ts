import { verifyLoginCode } from "@/lib/auth/login";
import { withSessionCookie } from "@/lib/auth/server";
import { issueSoftApProvisionToken } from "@/lib/db/provision";
import { jsonWithCors, optionsCors } from "@/lib/api/cors";

export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return optionsCors(req);
}

export async function POST(req: Request) {
  let body: { email?: string; code?: string; softAp?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(req, { ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await verifyLoginCode(body.email ?? "", body.code ?? "");
  if (!result.ok) {
    return jsonWithCors(
      req,
      { ok: false, error: result.error },
      { status: 401 },
    );
  }

  let provisionToken: string | undefined;
  if (body.softAp) {
    const issued = await issueSoftApProvisionToken(result.user.id);
    provisionToken = issued.token;
  }

  const res = jsonWithCors(req, {
    ok: true,
    user: result.user,
    ...(provisionToken ? { provisionToken } : {}),
  });
  return withSessionCookie(res, result.user);
}
