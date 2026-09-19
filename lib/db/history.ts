import type { GateAccessHistoryEntry } from "@/lib/smartgate/types";
import { prisma } from "./client";

export type GateAccessAction = "OPEN" | "CLOSE";
export type GateAccessActorKind = "owner" | "share";

const HISTORY_LIMIT = 100;

export async function listGateAccessHistory(
  deviceId: string,
): Promise<GateAccessHistoryEntry[]> {
  const rows = await prisma.gateAccessEvent.findMany({
    where: { deviceId: deviceId.trim() },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return rows.map((row) => ({
    id: row.id,
    userName: row.actorName,
    action: row.action as GateAccessAction,
    timestamp: row.createdAt.getTime(),
  }));
}

export async function recordGateAccessEvent(input: {
  deviceId: string;
  action: GateAccessAction;
  actorName: string;
  actorKind: GateAccessActorKind;
  actorUserId?: string | null;
  shareId?: string | null;
}): Promise<GateAccessHistoryEntry> {
  const name = input.actorName.trim() || "Unknown";
  const row = await prisma.gateAccessEvent.create({
    data: {
      deviceId: input.deviceId.trim(),
      action: input.action,
      actorName: name,
      actorKind: input.actorKind,
      actorUserId: input.actorUserId?.trim() || null,
      shareId: input.shareId?.trim() || null,
    },
  });
  return {
    id: row.id,
    userName: row.actorName,
    action: row.action as GateAccessAction,
    timestamp: row.createdAt.getTime(),
  };
}
