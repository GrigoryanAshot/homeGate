"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useGates } from "./GatesProvider";
import { useLocale } from "./LocaleProvider";
import { BackButton } from "./BackButton";

export function AddGateScanModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: (gateName: string) => void;
}) {
  const { locale, t } = useLocale();
  const { addGateFromScan, suggestNextGateName } = useGates();
  const [mounted, setMounted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"scan" | "name">("scan");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setStep("scan");
      setScanning(false);
      setName(suggestNextGateName(locale));
    }
  }, [open, locale, suggestNextGateName]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleSimulateScan() {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setStep("name");
    }, 1400);
  }

  function handleSave() {
    const gate = addGateFromScan(name);
    onAdded?.(gate.name);
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[28px] border border-gate-line bg-gate-surface p-5 shadow-gate"
      >
        <div className="mb-4 flex items-center gap-2">
          <BackButton onClick={onClose} />
          <h2 className="text-lg font-bold text-gate-ink">{t.scanGateTitle}</h2>
        </div>

        {step === "scan" ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-gate-muted">
              {t.scanGateHint}
            </p>
            <div
              className={cn(
                "relative mx-auto mb-4 aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-900",
                scanning && "animate-pulse",
              )}
            >
              <div className="absolute inset-6 rounded-xl border-2 border-dashed border-white/70" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400/80 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-lg bg-black/50 px-3 py-1 text-xs font-medium text-white">
                  {scanning ? t.scanGateScanning : "QR"}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={handleSimulateScan}
              className="w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-60"
            >
              {scanning ? t.scanGateScanning : t.scanGateAction}
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-green-700">{t.scanGateSuccess}</p>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-semibold text-gate-muted">
                {t.scanGateNameLabel}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-gate-line px-4 py-3 text-sm outline-none ring-blue-400 focus:ring-2"
              />
            </label>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleSave}
              className="w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
            >
              {t.scanGateSave}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
