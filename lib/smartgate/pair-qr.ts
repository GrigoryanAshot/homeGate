export type PairPayload = {
  deviceId: string;
  secret: string;
};

/**
 * Supported QR / paste formats:
 * - smartgate://pair?id=demo-gate-001&s=secret-demo-001
 * - https://any.host/pair?id=...&s=...
 * - {"deviceId":"...","secret":"..."}
 * - demo-gate-001|secret-demo-001
 */
export function parsePairPayload(raw: string): PairPayload | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    if (text.startsWith("{")) {
      const json = JSON.parse(text) as {
        deviceId?: string;
        id?: string;
        secret?: string;
        s?: string;
      };
      const deviceId = (json.deviceId ?? json.id)?.trim();
      const secret = (json.secret ?? json.s)?.trim();
      if (deviceId && secret) return { deviceId, secret };
    }
  } catch {
    /* fall through */
  }

  if (text.includes("|")) {
    const [deviceId, secret] = text.split("|").map((p) => p.trim());
    if (deviceId && secret) return { deviceId, secret };
  }

  try {
    const asUrl = text.includes("://")
      ? new URL(text)
      : new URL(text, "https://pair.local");
    const deviceId = (
      asUrl.searchParams.get("id") ||
      asUrl.searchParams.get("deviceId") ||
      ""
    ).trim();
    const secret = (
      asUrl.searchParams.get("s") ||
      asUrl.searchParams.get("secret") ||
      ""
    ).trim();
    if (deviceId && secret) return { deviceId, secret };
  } catch {
    /* ignore */
  }

  return null;
}

export function buildPairQrValue(deviceId: string, secret: string): string {
  return `smartgate://pair?id=${encodeURIComponent(deviceId)}&s=${encodeURIComponent(secret)}`;
}
