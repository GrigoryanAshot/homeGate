import { createHash, timingSafeEqual } from "crypto";
import type { Device } from "@prisma/client";
import { prisma } from "./client";

export type DeviceStatus = "FREE" | "BUSY";
export const DeviceStatus = {
  FREE: "FREE",
  BUSY: "BUSY",
} as const;

export type { Device };
export { prisma };

export function hashDeviceSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function secretsMatch(rawSecret: string, secretHash: string): boolean {
  const a = Buffer.from(hashDeviceSecret(rawSecret), "utf8");
  const b = Buffer.from(secretHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type DevicePublic = {
  id: string;
  status: DeviceStatus;
  chipId: string | null;
  ownerId: string | null;
  name: string | null;
  claimedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

export function toPublicDevice(device: Device): DevicePublic {
  return {
    id: device.id,
    status: device.status as DeviceStatus,
    chipId: device.chipId,
    ownerId: device.ownerId,
    name: device.name,
    claimedAt: device.claimedAt?.toISOString() ?? null,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    createdAt: device.createdAt.toISOString(),
  };
}

/**
 * ESP online after SoftAP: product must already exist (factory seed).
 * Binds chipId + refreshes lastSeenAt. Does NOT create new product rows.
 */
export async function registerDevice(
  deviceId: string,
  secret: string,
  chipId?: string,
) {
  const id = deviceId.trim();
  const chip = chipId?.trim() || null;

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }
  if (!secretsMatch(secret, existing.secretHash)) {
    return { ok: false as const, error: "invalid_secret" as const };
  }

  if (chip) {
    const taken = await prisma.device.findFirst({
      where: { chipId: chip, NOT: { id } },
    });
    if (taken) {
      return { ok: false as const, error: "chip_in_use" as const };
    }
    // Once a product has a chip, another ESP must not steal this sticker.
    if (existing.chipId && existing.chipId !== chip) {
      return { ok: false as const, error: "wrong_chip" as const };
    }
  }

  const updated = await prisma.device.update({
    where: { id },
    data: {
      lastSeenAt: new Date(),
      // Only bind chip when unset; never replace an existing chip via register
      ...(chip && !existing.chipId ? { chipId: chip } : {}),
    },
  });
  return { ok: true as const, device: toPublicDevice(updated), created: false };
}

/** Pre-create FREE sticker products for factory print run. */
export async function seedFactoryDevice(deviceId: string, secret: string) {
  const id = deviceId.trim();
  const secretHash = hashDeviceSecret(secret);
  const existing = await prisma.device.findUnique({ where: { id } });
  if (existing) {
    return { ok: true as const, device: toPublicDevice(existing), created: false };
  }
  const created = await prisma.device.create({
    data: {
      id,
      secretHash,
      status: DeviceStatus.FREE,
    },
  });
  return { ok: true as const, device: toPublicDevice(created), created: true };
}

export async function listDevicesForOwner(ownerId: string) {
  const rows = await prisma.device.findMany({
    where: { ownerId },
    orderBy: [{ claimedAt: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toPublicDevice);
}

/**
 * Phone claims a FREE device. Rejects if BUSY (already in use).
 */
export async function claimDevice(input: {
  deviceId: string;
  secret: string;
  ownerId: string;
  name?: string;
}) {
  const id = input.deviceId.trim();
  const device = await prisma.device.findUnique({ where: { id } });

  if (!device) {
    return { ok: false as const, error: "not_found" as const };
  }
  if (!secretsMatch(input.secret, device.secretHash)) {
    return { ok: false as const, error: "invalid_secret" as const };
  }
  if (device.status === DeviceStatus.BUSY) {
    if (device.ownerId === input.ownerId) {
      let chipBound: string | null = null;
      if (!device.chipId) {
        try {
          const { bindPendingChipToProduct } = await import("./chip-bind");
          const bind = await bindPendingChipToProduct(id, input.secret);
          if (bind.ok) chipBound = bind.chipId;
        } catch (e) {
          console.error("[claim] chip bind re-own", e);
        }
      }
      // Keep the existing display name — re-scanning must not rename
      // "Gate 1" to "Gate 3" and make the first gate look deleted.
      const updated = await prisma.device.update({
        where: { id },
        data: { lastSeenAt: new Date() },
      });
      return {
        ok: true as const,
        device: toPublicDevice(updated),
        alreadyOwned: true,
        chipBound,
      };
    }
    return { ok: false as const, error: "already_in_use" as const };
  }

  const updated = await prisma.device.update({
    where: { id },
    data: {
      status: DeviceStatus.BUSY,
      ownerId: input.ownerId,
      name: input.name?.trim() || null,
      claimedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });

  // SoftAP is Wi‑Fi only — attach the ESP that just came online (if any).
  let chipBound: string | null = null;
  try {
    const { bindPendingChipToProduct } = await import("./chip-bind");
    const bind = await bindPendingChipToProduct(id, input.secret);
    if (bind.ok) chipBound = bind.chipId;
  } catch (e) {
    console.error("[claim] chip bind", e);
  }

  const finalDevice = chipBound
    ? await prisma.device.findUnique({ where: { id } })
    : updated;

  return {
    ok: true as const,
    device: toPublicDevice(finalDevice ?? updated),
    alreadyOwned: false,
    chipBound,
  };
}

/**
 * Hardware / owner reset: clear owner, set FREE. Device row stays.
 */
export async function resetDevice(deviceId: string, secret: string) {
  const id = deviceId.trim();
  const device = await prisma.device.findUnique({ where: { id } });

  if (!device) {
    return { ok: false as const, error: "not_found" as const };
  }
  if (!secretsMatch(secret, device.secretHash)) {
    return { ok: false as const, error: "invalid_secret" as const };
  }

  const updated = await prisma.device.update({
    where: { id },
    data: {
      status: DeviceStatus.FREE,
      ownerId: null,
      name: null,
      claimedAt: null,
      lastSeenAt: new Date(),
    },
  });

  return { ok: true as const, device: toPublicDevice(updated) };
}

export async function getDevice(deviceId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId.trim() },
  });
  if (!device) return null;
  return toPublicDevice(device);
}
