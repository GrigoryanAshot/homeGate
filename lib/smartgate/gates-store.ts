import type { Locale } from "@/lib/smartgate/i18n";

export interface UserGate {
  id: string;
  name: string;
  createdAt: number;
}

export const GATES_STORAGE_KEY = "smartgate-user-gates";
export const SELECTED_GATE_STORAGE_KEY = "smartgate-selected-gate";

function defaultGate(): UserGate {
  return {
    id: "gate-1",
    name: "Դարպաս 1",
    createdAt: Date.now(),
  };
}

export function loadUserGates(): UserGate[] {
  if (typeof window === "undefined") return [defaultGate()];
  try {
    const raw = window.localStorage.getItem(GATES_STORAGE_KEY);
    if (!raw) return [defaultGate()];
    const parsed = JSON.parse(raw) as UserGate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultGate()];
    return parsed;
  } catch {
    return [defaultGate()];
  }
}

export function saveUserGates(gates: UserGate[]) {
  window.localStorage.setItem(GATES_STORAGE_KEY, JSON.stringify(gates));
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
    id: deviceId?.trim() || `gate-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim() || nextGateDefaultName(existing.length, "hy"),
    createdAt: Date.now(),
  };
}
