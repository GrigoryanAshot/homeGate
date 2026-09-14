"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose, IconSettings } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { UserGate } from "@/lib/smartgate/gates-store";
import { useLocale } from "./LocaleProvider";

export function GateCardMenu({
  gate,
  mqttOnline,
  onRename,
  onReset,
  onRemove,
  onToast,
}: {
  gate: UserGate;
  mqttOnline: boolean;
  onRename: (id: string, name: string) => Promise<boolean>;
  onReset: (id: string) => boolean;
  onRemove: (id: string) => Promise<void>;
  onToast?: (message: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(gate.name);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setName(gate.name);
    setRenaming(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, gate.name]);

  async function saveRename() {
    setBusy(true);
    const ok = await onRename(gate.id, name);
    setBusy(false);
    if (ok) {
      onToast?.(t.toastGateRenamed);
      setRenaming(false);
      setOpen(false);
    } else {
      onToast?.(t.toastCommandFailed);
    }
  }

  function doReset() {
    if (!mqttOnline) {
      onToast?.(t.wifiResetNeedMqtt);
      return;
    }
    if (!window.confirm(t.gateResetConfirm(gate.name))) return;
    const ok = onReset(gate.id);
    if (ok) {
      onToast?.(t.wifiResetSentToast);
      setOpen(false);
    } else {
      onToast?.(t.wifiResetNeedMqtt);
    }
  }

  async function doRemove() {
    if (!window.confirm(t.gateRemoveConfirm(gate.name))) return;
    // Second check with product id so we never wipe the wrong mental card
    if (
      !window.confirm(
        `${gate.name}\nID: ${gate.id}\n\nOK = remove THIS gate only.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await onRemove(gate.id);
      onToast?.(t.toastGateRemoved);
      setOpen(false);
    } catch {
      onToast?.(t.toastCommandFailed);
    } finally {
      setBusy(false);
    }
  }

  const overlay =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
            role="presentation"
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`gate-menu-${gate.id}`}
              className="relative z-[201] w-full max-w-md overflow-hidden rounded-t-[28px] border border-gate-line bg-gate-bg shadow-gate sm:rounded-[28px]"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gate-line sm:hidden" />
              <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
                <div className="min-w-0">
                  <h2
                    id={`gate-menu-${gate.id}`}
                    className="truncate text-lg font-bold text-gate-ink"
                  >
                    {gate.name}
                  </h2>
                  <p className="text-xs text-gate-muted">{t.gateMenuHint}</p>
                </div>
                <button
                  type="button"
                  aria-label={t.settingsClose}
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gate-surface text-gate-muted ring-1 ring-gate-line"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {renaming ? (
                  <div className="space-y-2 rounded-2xl border border-gate-line bg-gate-surface p-3">
                    <label className="block text-xs font-semibold text-gate-muted">
                      {t.gateRenameLabel}
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy || !name.trim()}
                        onClick={saveRename}
                        className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white disabled:opacity-45"
                      >
                        {t.saveAccessChanges}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(false)}
                        className="rounded-xl border border-gate-line px-4 py-2.5 text-sm font-semibold"
                      >
                        {t.back}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setRenaming(true)}
                      className="flex w-full items-center rounded-2xl border border-gate-line bg-gate-surface px-4 py-3.5 text-left text-sm font-bold text-gate-ink active:bg-slate-50"
                    >
                      {t.gateRenameAction}
                    </button>
                    <button
                      type="button"
                      onClick={doReset}
                      className="flex w-full items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-left text-sm font-bold text-amber-900 active:bg-amber-100"
                    >
                      {t.gateResetAction}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={doRemove}
                      className="flex w-full items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-left text-sm font-bold text-red-800 active:bg-red-100 disabled:opacity-45"
                    >
                      {t.gateRemoveAction}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        aria-label={t.gateMenuHint}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "absolute left-2 top-2 z-[2] flex h-8 w-8 items-center justify-center rounded-lg border border-gate-line/80 bg-gate-surface/90 text-gate-muted shadow-sm transition active:scale-95",
          open && "border-blue-300 bg-blue-50 text-blue-700",
        )}
      >
        <IconSettings className="h-4 w-4" />
      </button>
      {overlay}
    </>
  );
}
