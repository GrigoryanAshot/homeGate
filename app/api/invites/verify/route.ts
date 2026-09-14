import { NextResponse } from "next/server";
import { getActiveShareById } from "@/lib/db/shares";
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

  // DB is source of truth when the share exists (per-gate isolation).
  const dbShare = await getActiveShareById(result.payload.id);
  if (dbShare) {
    if (dbShare.deviceId !== result.payload.gateId) {
      return NextResponse.json(
        { valid: false, reason: "revoked" },
        { status: 403 },
      );
    }
  } else {
    // Legacy invite (pre-DB): only block when ACL was read and id is missing.
    const allow = await inviteAllowStatus(
      result.payload.id,
      undefined,
      result.payload.gateId,
    );
    if (allow === "no") {
      return NextResponse.json(
        { valid: false, reason: "revoked" },
        { status: 403 },
      );
    }
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
