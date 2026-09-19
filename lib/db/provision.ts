import { randomBytes } from "crypto";
import { prisma } from "./client";
import { DeviceStatus, hashDeviceSecret } from "./devices";

/** Never auto-provision onto these — keep Ashot's real gate + seed stickers intact. */
export const RESERVED_PRODUCT_IDS = new Set([
  "demo-gate-001",
  "demo-gate-002",
  "demo-gate-003",
  "demo-gate-busy",
]);

const TOKEN_TTL_MS = 45 * 60 * 1000;

function newProvisionToken(): string {
  return randomBytes(24).toString("base64url");
}

function newDeviceId(): string {
  return `g_${randomBytes(8).toString("hex")}`;
}

function newDeviceSecret(): string {
  return randomBytes(18).toString("base64url");
}

export async function issueSoftApProvisionToken(userId: string) {
  const token = newProvisionToken();
  const handoffToken = newProvisionToken();
  await prisma.softApProvisionToken.create({
    data: {
      token,
      handoffToken,
      userId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return {
    token,
    handoffToken,
    expiresInSec: Math.floor(TOKEN_TTL_MS / 1000),
  };
}

/** SoftAP success page → open app already signed in as that user. */
export async function consumeSoftApHandoff(handoffToken: string) {
  const token = handoffToken.trim();
  if (!token) return { ok: false as const, error: "missing" as const };

  const row = await prisma.softApProvisionToken.findUnique({
    where: { handoffToken: token },
  });
  if (
    !row ||
    row.handoffUsedAt ||
    row.expiresAt.getTime() < Date.now()
  ) {
    return { ok: false as const, error: "invalid" as const };
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return { ok: false as const, error: "invalid" as const };

  await prisma.softApProvisionToken.update({
    where: { id: row.id },
    data: { handoffUsedAt: new Date() },
  });

  return {
    ok: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function completeSoftApProvision(input: {
  chipId: string;
  provisionToken: string;
}) {
  const chipId = input.chipId.trim();
  const token = input.provisionToken.trim();
  if (!chipId || !token) {
    return { ok: false as const, error: "missing_fields" as const };
  }

  const row = await prisma.softApProvisionToken.findUnique({
    where: { token },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "invalid_token" as const };
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) {
    return { ok: false as const, error: "invalid_token" as const };
  }

  // Chip already on a reserved / other device — do not steal
  const existingChip = await prisma.device.findFirst({
    where: { chipId },
    select: { id: true, ownerId: true },
  });
  if (existingChip) {
    if (RESERVED_PRODUCT_IDS.has(existingChip.id)) {
      return { ok: false as const, error: "chip_reserved" as const };
    }
    if (existingChip.ownerId === user.id) {
      await prisma.softApProvisionToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });
      const secretRow = await prisma.chipBindOffer.findUnique({
        where: { chipId },
      });
      return {
        ok: true as const,
        productId: existingChip.id,
        secret: secretRow?.secret || "bound",
        name: null as string | null,
        reused: true,
      };
    }
    return { ok: false as const, error: "chip_in_use" as const };
  }

  const ownedCount = await prisma.device.count({
    where: { ownerId: user.id, status: DeviceStatus.BUSY },
  });
  const displayName = `Դարպաս ${ownedCount + 1}`;

  const deviceId = newDeviceId();
  const secret = newDeviceSecret();
  // Guard: never collide with reserved ids (astronomically unlikely for g_*)
  if (RESERVED_PRODUCT_IDS.has(deviceId)) {
    return { ok: false as const, error: "server_error" as const };
  }

  await prisma.$transaction([
    prisma.device.create({
      data: {
        id: deviceId,
        secretHash: hashDeviceSecret(secret),
        status: DeviceStatus.BUSY,
        ownerId: user.id,
        name: displayName,
        chipId,
        claimedAt: new Date(),
        lastSeenAt: new Date(),
      },
    }),
    prisma.chipBindOffer.upsert({
      where: { chipId },
      create: { chipId, productId: deviceId, secret },
      update: { productId: deviceId, secret, createdAt: new Date() },
    }),
    prisma.chipPending.deleteMany({ where: { chipId } }),
    prisma.softApProvisionToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    ok: true as const,
    productId: deviceId,
    secret,
    name: displayName,
    reused: false,
  };
}
