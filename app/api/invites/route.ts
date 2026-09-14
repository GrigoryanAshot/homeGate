import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import {
  assertDeviceOwnedBy,
  createGateShare,
  listActiveShareIdsForDevice,
  listActiveSharesForDevice,
  revokeAllSharesForDevice,
  revokeGateShare,
  updateGateShare,
} from "@/lib/db/shares";
import {
  writeInviteAllowList,
  type MqttCreds,
} from "@/lib/smartgate/acl-mqtt";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/smartgate/invites";
import type { ControllerAccessRule } from "@/lib/smartgate/types";

export const runtime = "nodejs";

async function syncAclFromDb(gateId: string, mqtt?: MqttCreds) {
  const allow = await listActiveShareIdsForDevice(gateId);
  await writeInviteAllowList(allow, mqtt, gateId);
}

/** List members for one gate (owner only). Isolated per deviceId. */
export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const gateId = new URL(req.url).searchParams.get("gateId")?.trim();
  if (!gateId) {
    return NextResponse.json({ error: "gateId required" }, { status: 400 });
  }

  const owned = await assertDeviceOwnedBy(gateId, session.id);
  if (!owned) {
    // Local placeholder gates (gate-*) have no DB row — empty list is fine
    return NextResponse.json({ shares: [], source: "none" });
  }

  const shares = await listActiveSharesForDevice(gateId);
  return NextResponse.json({
    shares: shares.map((s) => ({
      id: s.id,
      name: s.name,
      rule: s.rule,
      grantedAt: s.grantedAt,
      url: s.shareUrlToken ? buildInviteUrl(s.shareUrlToken, req) : undefined,
    })),
    source: "db",
  });
}

export async function POST(req: Request) {
  let body: {
    gateId?: string;
    name?: string;
    rule?: ControllerAccessRule;
    id?: string;
    mqtt?: MqttCreds;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const gateId = body.gateId?.trim();
  const name = body.name?.trim();
  const rule = body.rule;

  if (!gateId || !name || !rule?.type) {
    return NextResponse.json(
      { error: "gateId, name, and rule are required" },
      { status: 400 },
    );
  }

  const id = body.id?.trim() || randomBytes(12).toString("base64url");

  const token = createInviteToken({
    gateId,
    name,
    rule,
    id,
  });

  const session = await getSessionUser();
  if (session) {
    const owned = await assertDeviceOwnedBy(gateId, session.id);
    if (owned) {
      try {
        await createGateShare({ id, deviceId: gateId, name, rule, token });
        await syncAclFromDb(gateId, body.mqtt);
      } catch (e) {
        console.error("GateShare create / ACL sync failed", e);
        return NextResponse.json(
          { error: "Could not activate invite" },
          { status: 502 },
        );
      }
      return NextResponse.json({
        id,
        token,
        url: buildInviteUrl(token, req),
      });
    }
  }

  // Fallback for unsigned / local demo gates: ACL only (DB source of truth skipped)
  try {
    const { addInviteToAllowList } = await import("@/lib/smartgate/acl-mqtt");
    await addInviteToAllowList(id, body.mqtt, gateId);
  } catch (e) {
    console.error("ACL add failed", e);
    return NextResponse.json(
      { error: "Could not activate invite on broker" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    id,
    token,
    url: buildInviteUrl(token, req),
  });
}

/** Update access (re-mints token) for an existing share on this gate only. */
export async function PATCH(req: Request) {
  let body: {
    id?: string;
    gateId?: string;
    name?: string;
    rule?: ControllerAccessRule;
    mqtt?: MqttCreds;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  const gateId = body.gateId?.trim();
  const name = body.name?.trim();
  const rule = body.rule;
  if (!id || !gateId || !name || !rule?.type) {
    return NextResponse.json(
      { error: "id, gateId, name, and rule are required" },
      { status: 400 },
    );
  }

  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (!(await assertDeviceOwnedBy(gateId, session.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = createInviteToken({ gateId, name, rule, id });
  try {
    await updateGateShare({ id, deviceId: gateId, name, rule, token });
    await syncAclFromDb(gateId, body.mqtt);
  } catch (e) {
    console.error("GateShare update failed", e);
    return NextResponse.json({ error: "update_failed" }, { status: 502 });
  }

  return NextResponse.json({
    id,
    token,
    url: buildInviteUrl(token, req),
  });
}

/** Revoke invite — link stops working. Pass clearAll to wipe every shared member on this gate only. */
export async function DELETE(req: Request) {
  let body: {
    id?: string;
    clearAll?: boolean;
    gateId?: string;
    mqtt?: MqttCreds;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const gateId = body.gateId?.trim();
  if (!gateId) {
    return NextResponse.json({ error: "gateId required" }, { status: 400 });
  }

  const session = await getSessionUser();

  if (body.clearAll) {
    try {
      if (session && (await assertDeviceOwnedBy(gateId, session.id))) {
        await revokeAllSharesForDevice(gateId);
        await syncAclFromDb(gateId, body.mqtt);
      } else {
        await writeInviteAllowList([], body.mqtt, gateId);
      }
    } catch (e) {
      console.error("ACL clear failed", e);
      return NextResponse.json(
        { error: "Could not clear invites on broker" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, cleared: true, gateId });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    if (session && (await assertDeviceOwnedBy(gateId, session.id))) {
      await revokeGateShare(id, gateId);
      await syncAclFromDb(gateId, body.mqtt);
    } else {
      const { removeInviteFromAllowList } = await import(
        "@/lib/smartgate/acl-mqtt"
      );
      await removeInviteFromAllowList(id, body.mqtt, gateId);
    }
  } catch (e) {
    console.error("ACL remove failed", e);
    return NextResponse.json(
      { error: "Could not revoke invite on broker" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id, gateId });
}
