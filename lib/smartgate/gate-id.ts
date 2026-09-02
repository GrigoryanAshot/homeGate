export const GATE_ID_STORAGE_KEY = "smartgate-active-gate";

export const DEFAULT_GATE_ID =
  process.env.NEXT_PUBLIC_DEFAULT_GATE_ID ?? "default";

export function getActiveGateId(): string {
  if (typeof window === "undefined") return DEFAULT_GATE_ID;
  return (
    window.localStorage.getItem(GATE_ID_STORAGE_KEY) ?? DEFAULT_GATE_ID
  );
}

export function setActiveGateId(gateId: string) {
  window.localStorage.setItem(GATE_ID_STORAGE_KEY, gateId);
}
