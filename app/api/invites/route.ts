import { NextResponse } from "next/server";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/smartgate/invites";
import type { ControllerAccessRule } from "@/lib/smartgate/types";

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

  const token = createInviteToken({
    gateId,
    name,
    rule,
    id: body.id,
  });

  return NextResponse.json({
    token,
    url: buildInviteUrl(token),
  });
}
