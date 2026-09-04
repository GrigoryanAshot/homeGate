"use client";

import { useEffect, useRef } from "react";
import { AppLogo } from "@/components/ui/AppLogo";
import { useBiometric } from "./BiometricProvider";
import { useLocale } from "./LocaleProvider";

export function BiometricLockScreen() {
  const { t } = useLocale();
  const { locked, busy, unlock } = useBiometric();
  const autoTried = useRef(false);

  useEffect(() => {
    if (!locked) {
      autoTried.current = false;
      return;
    }
    if (autoTried.current) return;
    autoTried.current = true;
    void unlock();
  }, [locked, unlock]);

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-gate-bg px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gate-mesh" />
      <div className="relative z-[1] flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gate-line bg-gate-surface p-2 shadow-sm">
          <AppLogo size={56} />
        </div>
        <h1 className="text-xl font-bold text-gate-ink">{t.appTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gate-muted">
          {t.biometricLockHint}
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void unlock()}
          className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-blue-500 px-4 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] active:bg-blue-600 disabled:opacity-60"
        >
          <FingerprintIcon className="h-5 w-5" />
          {busy ? t.biometricChecking : t.biometricUnlock}
        </button>
      </div>
    </div>
  );
}

function FingerprintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 11c0 3-1.2 5.5-3 7.5" />
      <path d="M12 7a4 4 0 0 1 4 4c0 2.2-.6 4.2-1.6 5.8" />
      <path d="M8.5 9.2A4 4 0 0 1 12 7" />
      <path d="M6.2 12.5c.2 2.4 1.1 4.5 2.6 6.2" />
      <path d="M17.5 10.5c.2 3.2-.6 6-2.4 8.2" />
      <path d="M12 3.5c4.2 0 7.5 3 7.5 7.2 0 1.4-.2 2.7-.7 3.9" />
      <path d="M4.8 9.2C5.2 5.8 8.2 3.5 12 3.5" />
    </svg>
  );
}
