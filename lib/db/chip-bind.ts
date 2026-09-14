import { prisma } from "./client";

const PENDING_MAX_AGE_MS = 45 * 60 * 1000; // 45 min

export async function chipHello(chipId: string) {
  const id = chipId.trim();
  if (!id) return { ok: false as const, error: "missing_chip" as const };

  await prisma.chipPending.upsert({
    where: { chipId: id },
    create: { chipId: id },
    update: { lastSeenAt: new Date() },
  });

  return { ok: true as const, chipId: id };
}

/** ESP polls after Wi‑Fi — returns product once owner claimed the sticker. */
export async function getBindOfferForChip(chipId: string) {
  const id = chipId.trim();
  const offer = await prisma.chipBindOffer.findUnique({ where: { chipId: id } });
  if (offer) {
    return {
      ok: true as const,
      productId: offer.productId,
      secret: offer.secret,
      source: "offer" as const,
    };
  }

  const device = await prisma.device.findFirst({
    where: { chipId: id },
    select: { id: true, status: true },
  });
  if (device) {
    return {
      ok: true as const,
      productId: device.id,
      secret: "" as string,
      source: "device" as const,
    };
  }

  return { ok: false as const, error: "waiting" as const };
}

export async function consumeBindOffer(chipId: string) {
  await prisma.chipBindOffer.deleteMany({ where: { chipId: chipId.trim() } });
}

/**
 * After owner claims a sticker, attach the most recently online unbound ESP
 * (set up one gate at a time — best for elderly installers).
 */
export async function bindPendingChipToProduct(
  productId: string,
  secret: string,
) {
  const cutoff = new Date(Date.now() - PENDING_MAX_AGE_MS);
  const pending = await prisma.chipPending.findFirst({
    where: { lastSeenAt: { gte: cutoff } },
    orderBy: { lastSeenAt: "desc" },
  });

  if (!pending) {
    return { ok: false as const, error: "no_pending_chip" as const };
  }

  // Don't steal a chip already on another product
  const chipTaken = await prisma.device.findFirst({
    where: { chipId: pending.chipId, NOT: { id: productId } },
  });
  if (chipTaken) {
    await prisma.chipPending.delete({ where: { chipId: pending.chipId } });
    return { ok: false as const, error: "chip_in_use" as const };
  }

  await prisma.$transaction([
    prisma.device.update({
      where: { id: productId },
      data: { chipId: pending.chipId, lastSeenAt: new Date() },
    }),
    prisma.chipBindOffer.upsert({
      where: { chipId: pending.chipId },
      create: {
        chipId: pending.chipId,
        productId,
        secret,
      },
      update: {
        productId,
        secret,
        createdAt: new Date(),
      },
    }),
    prisma.chipPending.delete({ where: { chipId: pending.chipId } }),
  ]);

  return { ok: true as const, chipId: pending.chipId };
}
