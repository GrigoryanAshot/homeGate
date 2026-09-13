import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  addInviteToAllowList,
  removeInviteFromAllowList,
  writeInviteAllowList,
  type MqttCreds,
} from "@/lib/smartgate/acl-mqtt";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/smartgate/invites";
import type { ControllerAccessRule } from "@/lib/smartgate/types";

export const runtime = "nodejs";

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

  try {
    await addInviteToAllowList(id, body.mqtt);
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

/** Revoke invite — link stops working. Pass clearAll to wipe every shared member. */
export async function DELETE(req: Request) {
  let body: { id?: string; clearAll?: boolean; mqtt?: MqttCreds };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.clearAll) {
    try {
      await writeInviteAllowList([], body.mqtt);
    } catch (e) {
      console.error("ACL clear failed", e);
      return NextResponse.json(
        { error: "Could not clear invites on broker" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await removeInviteFromAllowList(id, body.mqtt);
  } catch (e) {
    console.error("ACL remove failed", e);
    return NextResponse.json(
      { error: "Could not revoke invite on broker" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
