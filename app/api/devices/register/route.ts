import { NextResponse } from "next/server";
import { registerDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * ESP first internet connect — register factory id + secret as FREE.
 * Body: { deviceId: string, secret: string }
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

    const result = await registerDevice(body.deviceId, body.secret);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 },
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
