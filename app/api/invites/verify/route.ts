import { NextResponse } from "next/server";
import { inviteAllowStatus } from "@/lib/smartgate/acl-mqtt";
import {
  checkOrBindInviteDevice,
  getClientIp,
} from "@/lib/smartgate/invite-device";
import { verifyInviteAccess } from "@/lib/smartgate/invites";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const deviceId = searchParams.get("deviceId")?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  if (!deviceId) {
    return NextResponse.json(
      { valid: false, reason: "invalid" },
      { status: 400 },
    );
  }

  const result = verifyInviteAccess(token);

  if (!result.ok) {
    return NextResponse.json(
      { valid: false, reason: result.reason },
      { status: 403 },
    );
  }

  // Only block when ACL was read successfully and id is missing.
  // MQTT timeout / auth errors must NOT look like "owner removed access".
  const allow = await inviteAllowStatus(result.payload.id);
  if (allow === "no") {
    return NextResponse.json(
      { valid: false, reason: "revoked" },
      { status: 403 },
    );
  }

  if (result.payload.rule.type !== "unlimited") {
    const bind = checkOrBindInviteDevice(
      result.payload.id,
      deviceId,
      getClientIp(req),
      req.headers.get("user-agent") ?? "",
    );

    if (bind === "other_device") {
      return NextResponse.json(
        { valid: false, reason: "other_device" },
        { status: 403 },
      );
    }
  }

  const { payload } = result;
  return NextResponse.json({
    valid: true,
    name: payload.name,
    gateId: payload.gateId,
    rule: payload.rule,
  });
}
