export const PRESENTATION_STORAGE_KEY = "smartgate-presentation";

export function readPresentationMode(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(PRESENTATION_STORAGE_KEY);
  if (stored === "0" || stored === "false") return false;
  return true;
}

export function storePresentationMode(enabled: boolean) {
  window.localStorage.setItem(PRESENTATION_STORAGE_KEY, enabled ? "1" : "0");
}

export const DEMO_GATES = [
  { id: "gate-home", labelHy: "Գլխավոր դարպաս", labelEn: "Main gate", labelRu: "Главные ворота" },
  { id: "gate-yard", labelHy: "Բակի դարպաս", labelEn: "Yard gate", labelRu: "Ворота во двор" },
] as const;

export type DemoGateId = (typeof DEMO_GATES)[number]["id"];

export function demoGuestUrl(guestName?: string): string {
  if (typeof window === "undefined") {
    return "https://home-gate-seven.vercel.app/invite/demo";
  }
  const base = `${window.location.origin}/invite/demo`;
  if (!guestName?.trim()) return base;
  return `${base}?guest=${encodeURIComponent(guestName.trim())}`;
}
