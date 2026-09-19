"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import type { GateKind } from "@/lib/smartgate/gate-kind";

export function GateTypePickerModal({
  open,
  gateName,
  onPick,
}: {
  open: boolean;
  gateName: string;
  onPick: (type: GateKind) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  async function pick(type: GateKind) {
    if (saving) return;
    setSaving(true);
    try {
      await onPick(type);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[28px] border border-gate-line bg-gate-surface p-5 shadow-gate"
      >
        <h2 className="text-lg font-bold text-gate-ink">{t.gateTypeTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gate-muted">
          {t.gateTypeHint(gateName)}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => void pick("rollup")}
            className="rounded-2xl bg-blue-500 px-4 py-4 text-left active:bg-blue-600 disabled:opacity-50"
          >
            <span className="block text-base font-bold text-white">
              {t.gateTypeRollup}
            </span>
            <span className="mt-0.5 block text-sm text-blue-100">
              {t.gateTypeRollupHint}
            </span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void pick("slide")}
            className="rounded-2xl border border-gate-line bg-gate-bg px-4 py-4 text-left active:bg-gate-card disabled:opacity-50"
          >
            <span className="block text-base font-bold text-gate-ink">
              {t.gateTypeSlide}
            </span>
            <span className="mt-0.5 block text-sm text-gate-muted">
              {t.gateTypeSlideHint}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
