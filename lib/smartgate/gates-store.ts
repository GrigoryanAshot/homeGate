import type { Locale } from "@/lib/smartgate/i18n";
import type { GateKind } from "@/lib/smartgate/gate-kind";

export interface UserGate {
  id: string;
  name: string;
  createdAt: number;
  /** null = owner has not chosen UI style yet */
  gateType?: GateKind | null;
}

export const GATES_STORAGE_KEY = "smartgate-user-gates";
export const SELECTED_GATE_STORAGE_KEY = "smartgate-selected-gate";

function gatesKey(userId?: string | null) {
  return userId ? `${GATES_STORAGE_KEY}:${userId}` : GATES_STORAGE_KEY;
}

function selectedKey(userId?: string | null) {
  return userId
    ? `${SELECTED_GATE_STORAGE_KEY}:${userId}`
    : SELECTED_GATE_STORAGE_KEY;
}

/** Drop only the old local placeholder id — never real product ids. */
function sanitizeGates(list: UserGate[]): UserGate[] {
  return list.filter(
    (g) =>
      g &&
      typeof g.id === "string" &&
      g.id.length > 0 &&
      g.id !== "gate-1",
  );
}

export function loadUserGates(userId?: string | null): UserGate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(gatesKey(userId)) ??
      (userId ? null : window.localStorage.getItem(GATES_STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserGate[];
    if (!Array.isArray(parsed)) return [];
    return sanitizeGates(parsed);
  } catch {
    return [];
  }
}

export function saveUserGates(gates: UserGate[], userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    gatesKey(userId),
    JSON.stringify(sanitizeGates(gates)),
  );
}

export function loadSelectedGateId(
  fallback: string,
  userId?: string | null,
): string {
  if (typeof window === "undefined") return fallback;
  return (
    window.localStorage.getItem(selectedKey(userId)) ??
    (userId ? null : window.localStorage.getItem(SELECTED_GATE_STORAGE_KEY)) ??
    fallback
  );
}

export function saveSelectedGateId(id: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(selectedKey(userId), id);
}

function defaultNameFor(n: number, locale: Locale): string {
  if (locale === "hy") return `Դարպաս ${n}`;
  if (locale === "ru") return `Ворота ${n}`;
  return `Gate ${n}`;
}

/** Next unused default name (avoids renaming collisions after re-scan). */
export function nextGateDefaultName(
  countOrGates: number | UserGate[],
  locale: Locale,
): string {
  const gates = Array.isArray(countOrGates) ? countOrGates : [];
  const used = new Set(
    gates.map((g) => g.name.trim().toLowerCase()).filter(Boolean),
  );

  let n = (Array.isArray(countOrGates) ? countOrGates.length : countOrGates) + 1;
  for (const g of gates) {
    const m = g.name.trim().match(/(\d+)\s*$/);
    if (m) n = Math.max(n, Number(m[1]) + 1);
  }

  let name = defaultNameFor(n, locale);
  while (used.has(name.toLowerCase())) {
    n += 1;
    name = defaultNameFor(n, locale);
  }
  return name;
}

export function createGateFromScan(
  name: string,
  existing: UserGate[],
  deviceId?: string,
): UserGate {
  return {
    id: deviceId?.trim() || `device-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim() || nextGateDefaultName(existing, "hy"),
    createdAt: Date.now(),
  };
}
