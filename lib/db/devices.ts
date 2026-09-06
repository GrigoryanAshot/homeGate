import { createHash, timingSafeEqual } from "crypto";
import { PrismaClient, type Device } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type DeviceStatus = "FREE" | "BUSY";
export const DeviceStatus = {
  FREE: "FREE",
  BUSY: "BUSY",
} as const;

export type { Device };

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
    ownerId: device.ownerId,
    name: device.name,
    claimedAt: device.claimedAt?.toISOString() ?? null,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    createdAt: device.createdAt.toISOString(),
  };
}

/**
 * ESP first online: register factory id + secret as FREE.
 * If already exists and secret matches → refresh lastSeenAt (idempotent).
 */
export async function registerDevice(deviceId: string, secret: string) {
  const id = deviceId.trim();
  const secretHash = hashDeviceSecret(secret);

  const existing = await prisma.device.findUnique({ where: { id } });
  if (existing) {
    if (!secretsMatch(secret, existing.secretHash)) {
      return { ok: false as const, error: "invalid_secret" as const };
    }
    const updated = await prisma.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
    return { ok: true as const, device: toPublicDevice(updated), created: false };
  }

  const created = await prisma.device.create({
    data: {
      id,
      secretHash,
      status: DeviceStatus.FREE,
      lastSeenAt: new Date(),
    },
  });
  return { ok: true as const, device: toPublicDevice(created), created: true };
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
      const updated = await prisma.device.update({
        where: { id },
        data: {
          name: input.name?.trim() || device.name,
          lastSeenAt: new Date(),
        },
      });
      return {
        ok: true as const,
        device: toPublicDevice(updated),
        alreadyOwned: true,
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

  return {
    ok: true as const,
    device: toPublicDevice(updated),
    alreadyOwned: false,
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
