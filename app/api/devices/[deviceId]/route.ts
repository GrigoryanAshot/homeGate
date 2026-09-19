import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { getDevice } from "@/lib/db/devices";
import {
  renameDeviceForOwner,
  unclaimDeviceForOwner,
} from "@/lib/db/shares";
import { writeInviteAllowList } from "@/lib/smartgate/acl-mqtt";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ deviceId: string }> };

/** Public status lookup (no secret). */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { deviceId } = await ctx.params;
    const device = await getDevice(decodeURIComponent(deviceId));
    if (!device) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, device });
  } catch (e) {
    console.error("[devices/get]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

/** Owner renames this gate only. */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "auth_required" },
        { status: 401 },
      );
    }

    const { deviceId } = await ctx.params;
    const id = decodeURIComponent(deviceId);
    const body = (await req.json()) as { name?: string; gateType?: string };

    if (body.gateType === "rollup" || body.gateType === "slide") {
      const { setGateTypeForOwner } = await import("@/lib/db/shares");
      const typed = await setGateTypeForOwner(session.id, id, body.gateType);
      if (!typed.ok) {
        const status = typed.error === "not_found" ? 404 : 400;
        return NextResponse.json(
          { ok: false, error: typed.error },
          { status },
        );
      }
      return NextResponse.json({ ok: true, gateType: typed.gateType });
    }

    const result = await renameDeviceForOwner(
      session.id,
      id,
      body.name ?? "",
    );

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json({ ok: true, name: result.name });
  } catch (e) {
    console.error("[devices/patch]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

/**
 * Owner removes this gate from their account.
 * Clears that gate’s sharings only; other gates untouched.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "auth_required" },
        { status: 401 },
      );
    }

    const { deviceId } = await ctx.params;
    const id = decodeURIComponent(deviceId);

    let mqtt: {
      host?: string;
      username?: string;
      password?: string;
      port?: number;
      path?: string;
    } | undefined;
    try {
      const body = (await req.json()) as { mqtt?: typeof mqtt };
      mqtt = body.mqtt;
    } catch {
      /* empty body ok */
    }

    const result = await unclaimDeviceForOwner(session.id, id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 404 },
      );
    }

    try {
      await writeInviteAllowList([], mqtt, id);
    } catch (e) {
      console.error("[devices/delete] ACL clear", e);
    }

    return NextResponse.json({ ok: true, deviceId: id });
  } catch (e) {
    console.error("[devices/delete]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
