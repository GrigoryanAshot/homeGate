import type { Locale } from "@/lib/smartgate/i18n";

export interface UserGate {
  id: string;
  name: string;
  createdAt: number;
}

export const GATES_STORAGE_KEY = "smartgate-user-gates";
export const SELECTED_GATE_STORAGE_KEY = "smartgate-selected-gate";

/** Drop legacy placeholder gate-1 that looked like a real “Դարպաս 1”. */
function sanitizeGates(list: UserGate[]): UserGate[] {
  return list.filter(
    (g) =>
      g &&
      typeof g.id === "string" &&
      g.id.length > 0 &&
      !g.id.startsWith("gate-"),
  );
}

export function loadUserGates(): UserGate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserGate[];
    if (!Array.isArray(parsed)) return [];
    return sanitizeGates(parsed);
  } catch {
    return [];
  }
}

export function saveUserGates(gates: UserGate[]) {
  window.localStorage.setItem(
    GATES_STORAGE_KEY,
    JSON.stringify(sanitizeGates(gates)),
  );
}

export function loadSelectedGateId(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(SELECTED_GATE_STORAGE_KEY) ?? fallback;
}

export function saveSelectedGateId(id: string) {
  window.localStorage.setItem(SELECTED_GATE_STORAGE_KEY, id);
}

export function nextGateDefaultName(count: number, locale: Locale): string {
  const n = count + 1;
  if (locale === "hy") return `Դարպաս ${n}`;
  if (locale === "ru") return `Ворота ${n}`;
  return `Gate ${n}`;
}

export function createGateFromScan(
  name: string,
  existing: UserGate[],
  deviceId?: string,
): UserGate {
  return {
    id: deviceId?.trim() || `device-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim() || nextGateDefaultName(existing.length, "hy"),
    createdAt: Date.now(),
  };
}
