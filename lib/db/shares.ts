import type { ControllerAccessRule } from "@/lib/smartgate/types";
import { prisma } from "./client";

export type GateSharePublic = {
  id: string;
  deviceId: string;
  name: string;
  rule: ControllerAccessRule;
  grantedAt: number;
  shareUrlToken?: string;
};

function parseRule(ruleJson: string): ControllerAccessRule {
  try {
    const rule = JSON.parse(ruleJson) as ControllerAccessRule;
    if (rule && typeof rule.type === "string") return rule;
  } catch {
    /* fall through */
  }
  return { type: "unlimited" };
}

export async function assertDeviceOwnedBy(
  deviceId: string,
  ownerId: string,
): Promise<boolean> {
  const device = await prisma.device.findFirst({
    where: { id: deviceId.trim(), ownerId },
    select: { id: true },
  });
  return !!device;
}

export async function listActiveSharesForDevice(
  deviceId: string,
): Promise<GateSharePublic[]> {
  const rows = await prisma.gateShare.findMany({
    where: { deviceId: deviceId.trim(), revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    deviceId: row.deviceId,
    name: row.name,
    rule: parseRule(row.ruleJson),
    grantedAt: row.createdAt.getTime(),
    shareUrlToken: row.token,
  }));
}

export async function listActiveShareIdsForDevice(
  deviceId: string,
): Promise<string[]> {
  const rows = await prisma.gateShare.findMany({
    where: { deviceId: deviceId.trim(), revokedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function createGateShare(input: {
  id: string;
  deviceId: string;
  name: string;
  rule: ControllerAccessRule;
  token: string;
}) {
  const row = await prisma.gateShare.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      deviceId: input.deviceId.trim(),
      name: input.name.trim(),
      ruleJson: JSON.stringify(input.rule),
      token: input.token,
      revokedAt: null,
    },
    update: {
      name: input.name.trim(),
      ruleJson: JSON.stringify(input.rule),
      token: input.token,
      revokedAt: null,
    },
  });
  return row;
}

export async function updateGateShare(input: {
  id: string;
  deviceId: string;
  name: string;
  rule: ControllerAccessRule;
  token: string;
}) {
  return prisma.gateShare.updateMany({
    where: { id: input.id, deviceId: input.deviceId.trim(), revokedAt: null },
    data: {
      name: input.name.trim(),
      ruleJson: JSON.stringify(input.rule),
      token: input.token,
    },
  });
}

export async function revokeGateShare(id: string, deviceId: string) {
  return prisma.gateShare.updateMany({
    where: { id, deviceId: deviceId.trim(), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSharesForDevice(deviceId: string) {
  return prisma.gateShare.updateMany({
    where: { deviceId: deviceId.trim(), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getActiveShareById(id: string) {
  return prisma.gateShare.findFirst({
    where: { id, revokedAt: null },
  });
}

export async function renameDeviceForOwner(
  ownerId: string,
  deviceId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "invalid_name" as const };

  const result = await prisma.device.updateMany({
    where: { id: deviceId.trim(), ownerId },
    data: { name: trimmed },
  });
  if (result.count === 0) {
    return { ok: false as const, error: "not_found" as const };
  }
  return { ok: true as const, name: trimmed };
}

export async function setGateTypeForOwner(
  ownerId: string,
  deviceId: string,
  gateType: "rollup" | "slide",
) {
  if (gateType !== "rollup" && gateType !== "slide") {
    return { ok: false as const, error: "invalid_type" as const };
  }
  const result = await prisma.device.updateMany({
    where: { id: deviceId.trim(), ownerId },
    data: { gateType },
  });
  if (result.count === 0) {
    return { ok: false as const, error: "not_found" as const };
  }
  return { ok: true as const, gateType };
}

/** Owner removes gate from account — FREE again; shares revoked. */
export async function unclaimDeviceForOwner(ownerId: string, deviceId: string) {
  const id = deviceId.trim();
  const device = await prisma.device.findFirst({
    where: { id, ownerId },
  });
  if (!device) {
    return { ok: false as const, error: "not_found" as const };
  }

  await prisma.$transaction([
    prisma.gateShare.updateMany({
      where: { deviceId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.device.update({
      where: { id },
      data: {
        status: "FREE",
        ownerId: null,
        name: null,
        gateType: null,
        chipId: null,
        claimedAt: null,
        lastSeenAt: new Date(),
      },
    }),
  ]);

  if (device.chipId) {
    await prisma.chipBindOffer.deleteMany({ where: { chipId: device.chipId } });
    await prisma.chipPending.deleteMany({ where: { chipId: device.chipId } });
  }

  return { ok: true as const };
}
