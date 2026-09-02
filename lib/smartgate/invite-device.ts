export interface InviteDeviceBinding {
  deviceId: string;
  ip: string;
  userAgent: string;
  boundAt: number;
}

/** In-memory until DB/KV — resets on serverless cold start */
const bindings = new Map<string, InviteDeviceBinding>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type DeviceBindResult = "ok" | "other_device";

/**
 * First phone to open the link locks this invite to its device ID (+ IP recorded).
 * Same phone may reconnect after IP change (Wi‑Fi ↔ mobile data).
 * Another phone is rejected even on the same Wi‑Fi IP.
 */
export function checkOrBindInviteDevice(
  inviteId: string,
  deviceId: string,
  ip: string,
  userAgent: string,
): DeviceBindResult {
  if (!deviceId || deviceId.length < 8) return "other_device";

  const existing = bindings.get(inviteId);
  if (!existing) {
    bindings.set(inviteId, {
      deviceId,
      ip,
      userAgent: userAgent.slice(0, 200),
      boundAt: Date.now(),
    });
    return "ok";
  }

  if (existing.deviceId === deviceId) return "ok";

  return "other_device";
}

export function isDeviceAuthorized(
  inviteId: string,
  deviceId: string,
): boolean {
  const existing = bindings.get(inviteId);
  if (!existing) return false;
  return existing.deviceId === deviceId;
}
