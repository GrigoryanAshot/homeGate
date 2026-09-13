import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { listDevicesForOwner } from "@/lib/db/devices";

export const runtime = "nodejs";

/** Signed-in owner's claimed gates. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "auth_required", devices: [] },
      { status: 401 },
    );
  }

  const devices = await listDevicesForOwner(session.id);
  return NextResponse.json({ ok: true, devices });
}
