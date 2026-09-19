import { completeSoftApProvision } from "@/lib/db/provision";
import { jsonWithCors, optionsCors } from "@/lib/api/cors";

export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return optionsCors(req);
}

/**
 * ESP after SoftAP email+Wi‑Fi: { chipId, provisionToken }
 * Creates a NEW gate for that user — never touches demo-gate-001.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      chipId?: string;
      provisionToken?: string;
    };
    const result = await completeSoftApProvision({
      chipId: body.chipId ?? "",
      provisionToken: body.provisionToken ?? "",
    });
    if (!result.ok) {
      const status =
        result.error === "missing_fields"
          ? 400
          : result.error === "chip_in_use" || result.error === "chip_reserved"
            ? 409
            : 401;
      return jsonWithCors(req, { ok: false, error: result.error }, { status });
    }
    return jsonWithCors(req, {
      ok: true,
      productId: result.productId,
      secret: result.secret,
      name: result.name,
      reused: result.reused,
    });
  } catch (e) {
    console.error("[devices/provision]", e);
    return jsonWithCors(
      req,
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
