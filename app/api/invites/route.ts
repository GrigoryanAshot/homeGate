import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  addInviteToAllowList,
  removeInviteFromAllowList,
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
    await addInviteToAllowList(id);
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

/** Revoke invite — link stops working */
export async function DELETE(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await removeInviteFromAllowList(id);
  } catch (e) {
    console.error("ACL remove failed", e);
    return NextResponse.json(
      { error: "Could not revoke invite on broker" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
