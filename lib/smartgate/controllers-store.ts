import type { ControllerAccessRule, GateController } from "./types";

export const CONTROLLERS_STORAGE_KEY = "smartgate-controllers";
export const CONTROLLERS_CHANGED_EVENT = "smartgate-controllers-changed";

export function loadControllers(): GateController[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTROLLERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GateController[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) => c && typeof c.id === "string" && typeof c.name === "string" && c.rule,
    );
  } catch {
    return [];
  }
}

export function saveControllers(controllers: GateController[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CONTROLLERS_STORAGE_KEY,
    JSON.stringify(controllers),
  );
}

/** Owner factory reset — wipe local share list and notify UI. */
export function clearControllers() {
  if (typeof window === "undefined") return;
  saveControllers([]);
  window.dispatchEvent(new Event(CONTROLLERS_CHANGED_EVENT));
}

export function upsertController(
  list: GateController[],
  controller: GateController,
): GateController[] {
  const i = list.findIndex((c) => c.id === controller.id);
  if (i < 0) return [...list, controller];
  const next = [...list];
  next[i] = controller;
  return next;
}

export type StoredController = GateController & {
  /** optional last share URL for resend */
  shareUrl?: string;
};
