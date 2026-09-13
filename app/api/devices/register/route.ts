import { NextResponse } from "next/server";
import { registerDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * ESP after SoftAP — bind chip to an existing FREE/BUSY factory product.
 * Body: { deviceId, secret, chipId? }
 * Product rows must be pre-seeded (stickers). Does not create new IDs.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      deviceId?: string;
      secret?: string;
      chipId?: string;
    };

    if (!body.deviceId?.trim() || !body.secret?.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const result = await registerDevice(
      body.deviceId,
      body.secret,
      body.chipId,
    );
    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "chip_in_use"
            ? 409
            : 401;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      device: result.device,
    });
  } catch (e) {
    console.error("[devices/register]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
