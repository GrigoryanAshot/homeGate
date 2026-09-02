import { NextResponse } from "next/server";
import { isDeviceAuthorized } from "@/lib/smartgate/invite-device";
import {
  markInviteUsed,
  verifyInviteAccess,
} from "@/lib/smartgate/invites";

export async function POST(req: Request) {
  let body: { token?: string; deviceId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token;
  const deviceId = body.deviceId?.trim() ?? "";

  if (!token || !deviceId) {
    return NextResponse.json(
      { error: "token and deviceId required" },
      { status: 400 },
    );
  }

  const result = verifyInviteAccess(token);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: 403 },
    );
  }

  if (!isDeviceAuthorized(result.payload.id, deviceId)) {
    return NextResponse.json(
      { ok: false, reason: "other_device" },
      { status: 403 },
    );
  }

  if (result.payload.rule.type === "once") {
    markInviteUsed(result.payload.id);
  }

  return NextResponse.json({ ok: true });
}
