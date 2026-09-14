import type { GateController } from "./types";

export const CONTROLLERS_STORAGE_KEY = "smartgate-controllers";
export const CONTROLLERS_BY_GATE_KEY = "smartgate-controllers-by-gate";
export const CONTROLLERS_CHANGED_EVENT = "smartgate-controllers-changed";

type ControllersByGate = Record<string, GateController[]>;

function isController(c: unknown): c is GateController {
  if (!c || typeof c !== "object") return false;
  const row = c as GateController;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    !!row.rule &&
    typeof row.rule === "object"
  );
}

function readByGate(): ControllersByGate {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CONTROLLERS_BY_GATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ControllersByGate;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: ControllersByGate = {};
    for (const [gateId, list] of Object.entries(parsed)) {
      if (!Array.isArray(list)) continue;
      out[gateId] = list.filter(isController);
    }
    return out;
  } catch {
    return {};
  }
}

function writeByGate(store: ControllersByGate) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTROLLERS_BY_GATE_KEY, JSON.stringify(store));
}

/** One-time migrate flat list → per-gate map under the given gate. */
function migrateLegacyIntoGate(gateId: string): ControllersByGate {
  const store = readByGate();
  if (Object.keys(store).length > 0) return store;

  try {
    const raw = window.localStorage.getItem(CONTROLLERS_STORAGE_KEY);
    if (!raw) return store;
    const parsed = JSON.parse(raw) as GateController[];
    if (!Array.isArray(parsed) || parsed.length === 0) return store;
    const migrated = parsed.filter(isController);
    if (migrated.length === 0) return store;
    const next = { ...store, [gateId]: migrated };
    writeByGate(next);
    window.localStorage.removeItem(CONTROLLERS_STORAGE_KEY);
    return next;
  } catch {
    return store;
  }
}

export function loadControllersForGate(gateId: string): GateController[] {
  if (typeof window === "undefined" || !gateId) return [];
  const store = migrateLegacyIntoGate(gateId);
  return store[gateId] ?? [];
}

/** @deprecated use loadControllersForGate — kept for accidental imports */
export function loadControllers(): GateController[] {
  if (typeof window === "undefined") return [];
  const store = readByGate();
  return Object.values(store).flat();
}

export function saveControllersForGate(
  gateId: string,
  controllers: GateController[],
) {
  if (typeof window === "undefined" || !gateId) return;
  const store = readByGate();
  store[gateId] = controllers.filter(isController);
  writeByGate(store);
}

/** @deprecated */
export function saveControllers(controllers: GateController[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CONTROLLERS_STORAGE_KEY,
    JSON.stringify(controllers),
  );
}

export function clearControllersForGate(gateId: string) {
  if (typeof window === "undefined" || !gateId) return;
  const store = readByGate();
  store[gateId] = [];
  writeByGate(store);
  window.dispatchEvent(
    new CustomEvent(CONTROLLERS_CHANGED_EVENT, { detail: { gateId } }),
  );
}

/** Wipe every gate’s local share list (rare — prefer clearControllersForGate). */
export function clearControllers() {
  if (typeof window === "undefined") return;
  writeByGate({});
  window.localStorage.removeItem(CONTROLLERS_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(CONTROLLERS_CHANGED_EVENT, { detail: { gateId: "*" } }),
  );
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
  shareUrl?: string;
};
