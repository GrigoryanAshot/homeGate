import { NextResponse } from "next/server";
import { resetDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * Hardware / authorized reset → status FREE, owner cleared.
 * Body: { deviceId, secret }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      deviceId?: string;
      secret?: string;
    };

    if (!body.deviceId?.trim() || !body.secret?.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const result = await resetDevice(body.deviceId, body.secret);
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 401;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json({ ok: true, device: result.device });
  } catch (e) {
    console.error("[devices/reset]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
