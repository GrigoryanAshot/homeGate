import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { claimDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * Phone claims a FREE device after QR scan.
 * Body: { deviceId, secret, name? } — owner from signed-in profile.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "auth_required" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as {
      deviceId?: string;
      secret?: string;
      name?: string;
    };

    if (!body.deviceId?.trim() || !body.secret?.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const result = await claimDevice({
      deviceId: body.deviceId,
      secret: body.secret,
      ownerId: session.id,
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
      chipBound: result.chipBound ?? null,
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
