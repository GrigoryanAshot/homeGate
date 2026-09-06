"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getOrCreateOwnerId } from "@/lib/smartgate/owner-id";
import {
  parsePairPayload,
  type PairPayload,
} from "@/lib/smartgate/pair-qr";
import { useGates } from "./GatesProvider";
import { useLocale } from "./LocaleProvider";
import { BackButton } from "./BackButton";
import { DeviceQrScanner } from "./DeviceQrScanner";
import { WifiSetupGuide } from "./WifiSetupGuide";

/** Kept for offline / desktop testing without a printed QR. */
const DEMO_FREE_QR =
  "smartgate://pair?id=demo-gate-001&s=secret-demo-001";

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
  const [cameraOn, setCameraOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [pair, setPair] = useState<PairPayload | null>(null);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"scan" | "name">("scan");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setStep("scan");
      setCameraOn(true);
      setSaving(false);
      setPair(null);
      setPaste("");
      setError(null);
      setName(suggestNextGateName(locale));
    } else {
      setCameraOn(false);
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

  const applyPayload = useCallback(
    (raw: string) => {
      const parsed = parsePairPayload(raw);
      if (!parsed) {
        setError(t.deviceQrInvalid);
        return;
      }
      setError(null);
      setCameraOn(false);
      setPair(parsed);
      setStep("name");
    },
    [t.deviceQrInvalid],
  );

  const handleDecoded = useCallback(
    (text: string) => {
      applyPayload(text);
    },
    [applyPayload],
  );

  function handlePasteClaim() {
    applyPayload(paste);
  }

  function handleDemoScan() {
    setCameraOn(false);
    applyPayload(DEMO_FREE_QR);
  }

  async function handleSave() {
    if (!pair || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/devices/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: pair.deviceId,
          secret: pair.secret,
          ownerId: getOrCreateOwnerId(),
          name: name.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        device?: { id: string; name: string | null };
      };

      if (!res.ok || !data.ok) {
        if (data.error === "already_in_use") setError(t.deviceAlreadyInUse);
        else if (data.error === "not_found") setError(t.deviceNotFound);
        else if (data.error === "invalid_secret") setError(t.deviceQrInvalid);
        else setError(t.deviceClaimFailed);
        return;
      }

      const gate = addGateFromScan(
        data.device?.name || name.trim(),
        data.device?.id || pair.deviceId,
      );
      onAdded?.(gate.name);
      onClose();
    } catch {
      setError(t.deviceClaimFailed);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-gate-line bg-gate-surface p-5 shadow-gate"
      >
        <div className="mb-4 flex items-center gap-2">
          <BackButton
            onClick={() => {
              if (step === "name") {
                setStep("scan");
                setPair(null);
                setError(null);
                setCameraOn(true);
                return;
              }
              setCameraOn(false);
              onClose();
            }}
          />
          <h2 className="text-lg font-bold text-gate-ink">{t.scanGateTitle}</h2>
        </div>

        {step === "scan" ? (
          <>
            <p className="mb-3 text-sm leading-relaxed text-gate-muted">
              {t.scanGateHintCamera}
            </p>
            <details className="mb-3 rounded-2xl border border-gate-line bg-gate-bg/80 px-3 py-2">
              <summary className="cursor-pointer text-sm font-bold text-gate-ink">
                {t.wifiSetupTitle}
              </summary>
              <div className="mt-2 pb-1">
                <WifiSetupGuide compact />
              </div>
            </details>

            {cameraOn ? (
              <DeviceQrScanner
                active={cameraOn && step === "scan"}
                onDecoded={handleDecoded}
                onError={(message) => setError(message)}
              />
            ) : (
              <div className="mx-auto mb-4 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl border-4 border-slate-800 bg-slate-900 text-sm text-white/80">
                {t.scanCameraStopped}
              </div>
            )}

            <div className="flex gap-2">
              {!cameraOn ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCameraOn(true);
                  }}
                  className="flex-1 rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white active:bg-blue-600"
                >
                  {t.scanGateAction}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCameraOn(false)}
                  className="flex-1 rounded-2xl border border-gate-line bg-gate-bg py-3.5 text-sm font-bold text-gate-ink active:bg-gate-card"
                >
                  {t.scanCameraStop}
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-gate-line pt-4">
              <button
                type="button"
                onClick={handleDemoScan}
                className="w-full rounded-2xl border border-dashed border-blue-300 bg-blue-50 py-3 text-sm font-bold text-blue-800 active:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-100"
              >
                {t.scanGateActionDemo}
              </button>

              <label className="mb-1 block text-xs font-semibold text-gate-muted">
                {t.scanGatePasteLabel}
              </label>
              <input
                type="text"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="smartgate://pair?id=…&s=…"
                className="mb-2 w-full rounded-2xl border border-gate-line bg-gate-bg px-4 py-3 text-sm outline-none ring-blue-400 focus:ring-2"
              />
              <button
                type="button"
                disabled={!paste.trim()}
                onClick={handlePasteClaim}
                className="w-full rounded-2xl border border-gate-line bg-gate-bg py-3 text-sm font-bold text-gate-ink active:bg-gate-card disabled:opacity-45"
              >
                {t.scanGatePasteAction}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mb-1 text-sm text-green-700">{t.scanGateSuccess}</p>
            {pair && (
              <p className="mb-3 font-mono text-[0.7rem] text-gate-muted">
                ID: {pair.deviceId}
              </p>
            )}
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
            {error && (
              <p className="mb-3 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={!name.trim() || saving}
              onClick={() => void handleSave()}
              className="w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
            >
              {saving ? t.pleaseWait : t.scanGateSave}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
