import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import {
  listGateAccessHistory,
  recordGateAccessEvent,
  type GateAccessAction,
} from "@/lib/db/history";
import {
  assertDeviceOwnedBy,
  getActiveShareById,
} from "@/lib/db/shares";
import {
  checkOrBindInviteDevice,
  getClientIp,
} from "@/lib/smartgate/invite-device";
import { verifyInviteAccess } from "@/lib/smartgate/invites";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ deviceId: string }> };

function parseAction(raw: unknown): GateAccessAction | null {
  if (raw === "OPEN" || raw === "CLOSE") return raw;
  return null;
}

/** Owner: last open/close events for this gate only. */
export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "auth_required", events: [] },
        { status: 401 },
      );
    }

    const { deviceId } = await context.params;
    const id = decodeURIComponent(deviceId ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "missing_device", events: [] },
        { status: 400 },
      );
    }

    const owned = await assertDeviceOwnedBy(id, session.id);
    if (!owned) {
      return NextResponse.json(
        { ok: false, error: "forbidden", events: [] },
        { status: 403 },
      );
    }

    const events = await listGateAccessHistory(id);
    return NextResponse.json({ ok: true, events });
  } catch (e) {
    console.error("[history GET]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", events: [] },
      { status: 500 },
    );
  }
}

/**
 * Record OPEN/CLOSE for this gate.
 * - Signed-in owner (session cookie)
 * - Shared controller (invite token + optional deviceId bind)
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const { deviceId } = await context.params;
    const id = decodeURIComponent(deviceId ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "missing_device" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as {
      action?: string;
      token?: string;
      deviceId?: string;
    };
    const action = parseAction(body.action);
    if (!action) {
      return NextResponse.json(
        { ok: false, error: "invalid_action" },
        { status: 400 },
      );
    }

    const session = await getSessionUser();
    if (session) {
      const owned = await assertDeviceOwnedBy(id, session.id);
      if (owned) {
        const actorName =
          session.name?.trim() || session.email?.trim() || "Owner";
        const event = await recordGateAccessEvent({
          deviceId: id,
          action,
          actorName,
          actorKind: "owner",
          actorUserId: session.id,
        });
        return NextResponse.json({ ok: true, event });
      }
    }

    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "auth_required" },
        { status: 401 },
      );
    }

    const result = verifyInviteAccess(token);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: 403 },
      );
    }

    if (result.payload.gateId !== id) {
      return NextResponse.json(
        { ok: false, error: "wrong_gate" },
        { status: 403 },
      );
    }

    const dbShare = await getActiveShareById(result.payload.id);
    if (dbShare && dbShare.deviceId !== id) {
      return NextResponse.json(
        { ok: false, error: "revoked" },
        { status: 403 },
      );
    }
    if (!dbShare) {
      return NextResponse.json(
        { ok: false, error: "revoked" },
        { status: 403 },
      );
    }

    if (result.payload.rule.type !== "unlimited") {
      const bindDeviceId = body.deviceId?.trim() ?? "";
      if (!bindDeviceId) {
        return NextResponse.json(
          { ok: false, error: "device_required" },
          { status: 400 },
        );
      }
      const bind = checkOrBindInviteDevice(
        result.payload.id,
        bindDeviceId,
        getClientIp(req),
        req.headers.get("user-agent") ?? "",
      );
      if (bind === "other_device") {
        return NextResponse.json(
          { ok: false, error: "other_device" },
          { status: 403 },
        );
      }
    }

    const event = await recordGateAccessEvent({
      deviceId: id,
      action,
      actorName: result.payload.name,
      actorKind: "share",
      shareId: result.payload.id,
    });
    return NextResponse.json({ ok: true, event });
  } catch (e) {
    console.error("[history POST]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
