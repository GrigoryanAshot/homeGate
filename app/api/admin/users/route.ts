import { getSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { DeviceStatus } from "@/lib/db/devices";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Owner-only overview: each user email + how many BUSY gates they own.
 * (Your demo-gate-001 stays a normal owned device in these counts.)
 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }
  // Simple gate: only the primary demo owner for now
  if (session.email !== "ashotgrigoryan94@gmail.com") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      devices: {
        where: { status: DeviceStatus.BUSY },
        select: { id: true, name: true, chipId: true, claimedAt: true },
      },
    },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({
    ok: true,
    users: users.map((u) => ({
      email: u.email,
      name: u.name,
      gateCount: u.devices.length,
      gates: u.devices,
    })),
  });
}
