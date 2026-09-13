"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronRight,
  IconClose,
  IconSettings,
} from "@/components/ui/icons";
import { localeLabels, SUPPORTED_LOCALES } from "@/lib/smartgate/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";
import { useTheme } from "./ThemeProvider";
import { WifiSetupGuide } from "./WifiSetupGuide";
import { ProfileAuthSection } from "./ProfileAuthSection";
import { getMqttConfig, saveMqttLocalConfig } from "@/lib/smartgate/types";

export function SettingsMenu({
  open,
  onOpenChange,
  onToast,
  onMqttSaved,
  onWifiReset,
  mqttOnline = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToast?: (message: string) => void;
  onMqttSaved?: () => void;
  onWifiReset?: () => boolean;
  mqttOnline?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();
  const { darkMode, toggleTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [wifiGuideOpen, setWifiGuideOpen] = useState(false);
  const [mqttOpen, setMqttOpen] = useState(false);
  const [mqttHost, setMqttHost] = useState("");
  const [mqttUser, setMqttUser] = useState("");
  const [mqttPass, setMqttPass] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setLangOpen(false);
      setWifiGuideOpen(false);
      setMqttOpen(false);
      const cfg = getMqttConfig();
      setMqttHost(cfg.host);
      setMqttUser(cfg.username);
      setMqttPass(cfg.password);
    }
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

  const overlay =
    open && mounted ? (
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
        role="presentation"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="relative z-[201] flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] border border-gate-line bg-gate-bg shadow-[0_-18px_50px_rgba(15,23,42,0.18)] sm:rounded-[32px] sm:shadow-gate"
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-gate-line sm:hidden" />

          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <div>
              <h2
                id="settings-title"
                className="text-[1.35rem] font-bold tracking-tight text-gate-ink"
              >
                {t.settings}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t.settingsClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gate-surface text-gate-muted shadow-sm ring-1 ring-gate-line active:bg-gate-card"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3">
              <ProfileAuthSection onToast={onToast} />
            </div>

            <div className="overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
              <button
                type="button"
                aria-expanded={langOpen}
                onClick={() => setLangOpen((v) => !v)}
                className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left active:bg-gate-card"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                  <span className="text-sm font-black tracking-wide">
                    {locale.toUpperCase()}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gate-ink">
                    {t.language}
                  </span>
                  <span className="block text-sm text-gate-muted">
                    {localeLabels[locale]}
                  </span>
                </span>
                <IconChevronRight
                  className={cn(
                    "h-5 w-5 text-gate-muted transition-transform",
                    langOpen && "rotate-90",
                  )}
                />
              </button>

              {langOpen && (
                <div className="grid grid-cols-3 gap-2 border-t border-gate-line bg-gate-card/70 px-3 py-3">
                  {SUPPORTED_LOCALES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLocale(code);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "flex min-h-[56px] flex-col items-center justify-center rounded-2xl text-sm font-bold transition",
                        locale === code
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-gate-surface text-gate-ink ring-1 ring-gate-line",
                      )}
                    >
                      <span>{code.toUpperCase()}</span>
                      <span
                        className={cn(
                          "mt-0.5 text-[11px] font-semibold",
                          locale === code ? "text-white/80" : "text-gate-muted",
                        )}
                      >
                        {localeLabels[code]}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={darkMode}
                className="flex min-h-[64px] w-full cursor-pointer items-center gap-3 border-t border-gate-line px-4 py-3 text-left active:bg-gate-card"
              >
                <span className="pointer-events-none flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-amber-50 dark:bg-indigo-500/20">
                  <input
                    type="checkbox"
                    className="theme-toggle pointer-events-none"
                    checked={darkMode}
                    readOnly
                    tabIndex={-1}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-bold text-gate-ink">
                  {t.darkMode}
                </span>
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
              <button
                type="button"
                aria-expanded={mqttOpen}
                onClick={() => setMqttOpen((v) => !v)}
                className="flex min-h-[58px] w-full items-center gap-3 px-4 py-3 text-left active:bg-gate-card"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sm font-black text-sky-800 dark:bg-sky-500/20 dark:text-sky-100">
                  MQTT
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gate-ink">
                    {t.mqttSettingsTitle}
                  </span>
                  <span className="block text-sm text-gate-muted">
                    {t.mqttSettingsHint}
                  </span>
                </span>
                <IconChevronRight
                  className={cn(
                    "h-5 w-5 text-gate-muted transition-transform",
                    mqttOpen && "rotate-90",
                  )}
                />
              </button>
              {mqttOpen && (
                <div className="space-y-3 border-t border-gate-line px-4 py-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gate-muted">
                      {t.mqttHost}
                    </span>
                    <input
                      value={mqttHost}
                      onChange={(e) => setMqttHost(e.target.value)}
                      autoComplete="off"
                      className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm text-gate-ink outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gate-muted">
                      {t.mqttUser}
                    </span>
                    <input
                      value={mqttUser}
                      onChange={(e) => setMqttUser(e.target.value)}
                      autoComplete="username"
                      className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm text-gate-ink outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gate-muted">
                      {t.mqttPass}
                    </span>
                    <input
                      type="password"
                      value={mqttPass}
                      onChange={(e) => setMqttPass(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm text-gate-ink outline-none focus:border-blue-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      saveMqttLocalConfig({
                        host: mqttHost,
                        username: mqttUser,
                        password: mqttPass,
                      });
                      onToast?.(t.mqttSavedToast);
                      onMqttSaved?.();
                      onOpenChange(false);
                    }}
                    className="w-full rounded-2xl bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600"
                  >
                    {t.mqttSave}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
              <button
                type="button"
                aria-expanded={wifiGuideOpen}
                onClick={() => setWifiGuideOpen((v) => !v)}
                className="flex min-h-[58px] w-full items-center gap-3 px-4 py-3 text-left active:bg-gate-card"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
                  Wi‑Fi
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gate-ink">
                    {t.wifiSetupTitle}
                  </span>
                  <span className="block text-sm text-gate-muted">
                    {t.wifiSetupMenuHint}
                  </span>
                </span>
                <IconChevronRight
                  className={cn(
                    "h-5 w-5 text-gate-muted transition-transform",
                    wifiGuideOpen && "rotate-90",
                  )}
                />
              </button>
              {wifiGuideOpen && (
                <div className="border-t border-gate-line px-4 py-3">
                  <WifiSetupGuide compact />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onToast?.(t.toastSpecialistRequested);
                onOpenChange(false);
              }}
              className="mt-3 flex min-h-[58px] w-full items-center justify-center rounded-[22px] bg-blue-500 px-4 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] active:scale-[0.99] active:bg-blue-600"
            >
              {t.connectSpecialist}
            </button>

            <div className="mt-3 overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
              <button
                type="button"
                onClick={() => {
                  if (!mqttOnline || !onWifiReset) {
                    onToast?.(t.wifiResetNeedMqtt);
                    return;
                  }
                  if (!window.confirm(t.wifiResetConfirm)) return;
                  const ok = onWifiReset();
                  if (ok) {
                    onToast?.(t.wifiResetSentToast);
                    setWifiGuideOpen(true);
                    onOpenChange(false);
                  } else {
                    onToast?.(t.wifiResetNeedMqtt);
                  }
                }}
                className="flex min-h-[56px] w-full items-center px-4 text-left text-[15px] font-semibold text-amber-800 active:bg-amber-50 dark:text-amber-200 dark:active:bg-amber-500/10"
              >
                {t.wifiResetAction}
              </button>
              <p className="border-t border-gate-line px-4 py-3 text-sm leading-relaxed text-gate-muted">
                {t.wifiSetupReset}
              </p>
            </div>

            <p className="mt-6 px-3 text-center text-[12px] leading-relaxed text-gate-muted">
              {t.creditBefore}
              <a
                href="https://www.touchweb.am"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-300"
              >
                Touch Web Agency
              </a>
              {t.creditAfter}
            </p>
          </div>
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
            ? "border-blue-400 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
            : "border-gate-line bg-gate-surface text-gate-muted hover:border-blue-200 hover:bg-blue-50 hover:text-gate-ink dark:hover:bg-blue-500/10",
        )}
      >
        <IconSettings className="h-5 w-5" />
      </button>

      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
