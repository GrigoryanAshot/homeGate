"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconSettings } from "@/components/ui/icons";
import { Toggle } from "@/components/ui/primitives";
import { localeLabels, SUPPORTED_LOCALES } from "@/lib/smartgate/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

export function SettingsMenu({
  open,
  onOpenChange,
  mockMode,
  presentationMode,
  onToggleMock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mockMode: boolean;
  presentationMode?: boolean;
  onToggleMock: () => void;
}) {
  const { locale, setLocale, t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onOpenChange]);

  const locales = SUPPORTED_LOCALES;

  const overlay =
    open && mounted ? (
      <div
        className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-[2px] sm:items-center sm:pt-4"
        role="presentation"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="relative z-[201] w-full max-w-md rounded-[28px] border border-gate-line bg-white p-5 shadow-gate sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="settings-title" className="text-xl font-bold text-gate-ink">
              {t.settings}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-gate-line px-4 py-2 text-sm font-semibold text-gate-muted hover:bg-slate-50"
            >
              {t.settingsClose}
            </button>
          </div>

          <section className="mb-5">
            <p className="mb-3 text-sm font-bold text-gate-ink">{t.language}</p>
            <div className="grid grid-cols-3 gap-2">
              {locales.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={cn(
                    "min-h-[52px] rounded-2xl border px-4 py-3 text-base font-bold transition",
                    locale === code
                      ? "border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-200"
                      : "border-gate-line bg-white text-gate-muted hover:border-blue-200 hover:bg-blue-50/50",
                  )}
                >
                  {localeLabels[code]}
                </button>
              ))}
            </div>
          </section>

          {!presentationMode && (
            <section className="mb-5 rounded-2xl border border-gate-line bg-slate-50 p-4">
              <Toggle
                checked={mockMode}
                onChange={onToggleMock}
                label={t.mockMode}
              />
              <p className="mt-3 text-sm leading-relaxed text-gate-muted">
                {mockMode ? t.mockModeHint : t.mockModeDescription}
              </p>
            </section>
          )}

          <section>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full rounded-2xl border border-gate-line bg-white py-3.5 text-sm font-bold text-gate-muted opacity-60"
            >
              {t.resetDevice}
            </button>
          </section>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        aria-label={t.settings}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "relative z-[2] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
          open
            ? "border-blue-400 bg-blue-100 text-blue-700"
            : "border-gate-line bg-white text-gate-muted hover:border-blue-200 hover:bg-blue-50 hover:text-gate-ink",
        )}
      >
        <IconSettings className="h-5 w-5" />
      </button>

      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
