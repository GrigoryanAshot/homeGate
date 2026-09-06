import { NextResponse } from "next/server";
import { getDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ deviceId: string }> };

/** Public status lookup (no secret). */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { deviceId } = await ctx.params;
    const device = await getDevice(decodeURIComponent(deviceId));
    if (!device) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, device });
  } catch (e) {
    console.error("[devices/get]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
