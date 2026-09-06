import { NextResponse } from "next/server";
import { claimDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * Phone claims a FREE device after QR scan.
 * Body: { deviceId, secret, ownerId, name? }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      deviceId?: string;
      secret?: string;
      ownerId?: string;
      name?: string;
    };

    if (
      !body.deviceId?.trim() ||
      !body.secret?.trim() ||
      !body.ownerId?.trim()
    ) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const result = await claimDevice({
      deviceId: body.deviceId,
      secret: body.secret,
      ownerId: body.ownerId,
      name: body.name,
    });

    if (!result.ok) {
      const status =
        result.error === "already_in_use"
          ? 409
          : result.error === "not_found"
            ? 404
            : 401;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyOwned: result.alreadyOwned,
      device: result.device,
    });
  } catch (e) {
    console.error("[devices/claim]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
