import { NextResponse } from "next/server";
import {
  chipHello,
  consumeBindOffer,
  getBindOfferForChip,
} from "@/lib/db/chip-bind";
import { registerDevice } from "@/lib/db/devices";

export const runtime = "nodejs";

/**
 * ESP after SoftAP Wi‑Fi (no sticker on SoftAP):
 * - POST { chipId } → mark online / waiting for app claim
 * - GET ?chipId= → poll for product id + secret after owner scans sticker
 * - POST { chipId, deviceId, secret } → classic register once product known
 */
export async function GET(req: Request) {
  try {
    const chipId = new URL(req.url).searchParams.get("chipId")?.trim();
    if (!chipId) {
      return NextResponse.json(
        { ok: false, error: "missing_chip" },
        { status: 400 },
      );
    }

    await chipHello(chipId);
    const offer = await getBindOfferForChip(chipId);
    if (!offer.ok) {
      return NextResponse.json({ ok: true, waiting: true });
    }

    if (offer.source === "offer" && offer.secret) {
      // ESP will save then call register — consume after successful register preferably;
      // keep offer until register so retries work. Leave for now.
      return NextResponse.json({
        ok: true,
        waiting: false,
        productId: offer.productId,
        secret: offer.secret,
      });
    }

    return NextResponse.json({
      ok: true,
      waiting: false,
      productId: offer.productId,
      secret: offer.secret || "",
    });
  } catch (e) {
    console.error("[devices/chip]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      chipId?: string;
      deviceId?: string;
      secret?: string;
      ack?: boolean;
    };

    const chipId = body.chipId?.trim();
    if (!chipId) {
      return NextResponse.json(
        { ok: false, error: "missing_chip" },
        { status: 400 },
      );
    }

    // ESP acknowledges it saved product — drop bind offer
    if (body.ack) {
      await consumeBindOffer(chipId);
      return NextResponse.json({ ok: true, acked: true });
    }

    // Classic register once product known
    if (body.deviceId?.trim() && body.secret?.trim()) {
      const secret = body.secret.trim();
      // Placeholder after offer already consumed — trust chip binding
      if (secret === "bound") {
        const { prisma } = await import("@/lib/db/client");
        const device = await prisma.device.findFirst({
          where: { chipId, id: body.deviceId.trim() },
        });
        if (!device) {
          return NextResponse.json(
            { ok: false, error: "not_found" },
            { status: 404 },
          );
        }
        await prisma.device.update({
          where: { id: device.id },
          data: { lastSeenAt: new Date() },
        });
        await consumeBindOffer(chipId);
        return NextResponse.json({ ok: true, device: { id: device.id } });
      }

      const result = await registerDevice(
        body.deviceId,
        secret,
        chipId,
      );
      if (!result.ok) {
        const status =
          result.error === "not_found"
            ? 404
            : result.error === "chip_in_use" || result.error === "wrong_chip"
              ? 409
              : 401;
        return NextResponse.json(
          { ok: false, error: result.error },
          { status },
        );
      }
      await consumeBindOffer(chipId);
      return NextResponse.json({
        ok: true,
        device: result.device,
      });
    }

    // Hello only — waiting for claim
    await chipHello(chipId);
    return NextResponse.json({ ok: true, waiting: true, chipId });
  } catch (e) {
    console.error("[devices/chip]", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
