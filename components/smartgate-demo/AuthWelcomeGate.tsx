"use client";

import { useState } from "react";
import { AppLogo } from "@/components/ui/AppLogo";
import { localeLabels, SUPPORTED_LOCALES } from "@/lib/smartgate/i18n";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";
import { ProfileAuthSection } from "./ProfileAuthSection";

/**
 * Owner app requires email profile (+ name) before any gate UI.
 * Guest /invite links stay outside this gate.
 */
export function AuthWelcomeGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [toast, setToast] = useState<string | null>(null);

  const ready = !!user?.id && !!user.name?.trim();

  if (loading) {
    return (
      <div className="app-shell flex flex-1 flex-col items-center justify-center gap-3 bg-gate-bg text-gate-ink">
        <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />
        <div className="relative z-[1] flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gate-line bg-gate-surface p-2 shadow-sm">
            <AppLogo size={56} />
          </div>
          <p className="text-lg font-bold tracking-tight text-gate-ink">
            {t.appTitle}
          </p>
        </div>
      </div>
    );
  }

  if (ready) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell bg-gate-bg text-gate-ink">
      <div className="pointer-events-none fixed inset-0 bg-gate-mesh" />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 py-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-gate-line bg-gate-surface p-1.5 shadow-sm">
              <AppLogo size={48} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gate-ink">
              {t.appTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gate-muted">
              {t.authWelcomeHint}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={
                  locale === code
                    ? "rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-xl border border-gate-line bg-gate-surface px-3 py-1.5 text-xs font-semibold text-gate-muted"
                }
              >
                {localeLabels[code]}
              </button>
            ))}
          </div>

          <ProfileAuthSection
            onToast={(msg) => {
              setToast(msg);
              window.setTimeout(() => setToast(null), 2400);
            }}
          />

          {user && !user.name?.trim() && (
            <p className="text-center text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              {t.authWelcomeNameRequired}
            </p>
          )}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(88vw,320px)] -translate-x-1/2 rounded-2xl border border-blue-200 bg-gate-surface px-4 py-3 text-center text-sm font-semibold text-gate-ink shadow-gate"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
