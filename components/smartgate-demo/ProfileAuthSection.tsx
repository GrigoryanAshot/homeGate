"use client";

import { useEffect, useState } from "react";
import { AppLogo } from "@/components/ui/AppLogo";
import { useAuth, type AuthUser } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

export function ProfileAuthSection({
  onToast,
}: {
  onToast?: (message: string) => void;
}) {
  const { t } = useLocale();
  const { user, loading, setUser, logout } = useAuth();
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.id, user?.name]);

  async function requestCode() {
    setBusy(true);
    setError(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
        devCode?: string;
        retryAfterSec?: number;
      };
      if (!res.ok || !data.ok) {
        if (data.error === "rate_limited") {
          setError(
            data.retryAfterSec != null
              ? t.authRateLimitedWait(data.retryAfterSec)
              : t.authRateLimited,
          );
        } else if (data.error === "invalid_email") setError(t.authInvalidEmail);
        else setError(t.authSendFailed);
        return;
      }
      if (data.email) setEmail(data.email);
      if (data.devCode) setDevHint(data.devCode);
      setStep("code");
      onToast?.(t.authCodeSentToast);
    } catch {
      setError(t.authSendFailed);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: AuthUser;
      };
      if (!res.ok || !data.ok || !data.user) {
        setError(t.authInvalidCode);
        return;
      }
      setUser(data.user);
      setDisplayName(data.user.name ?? "");
      setStep("idle");
      setCode("");
      setDevHint(null);
      onToast?.(t.authSignedInToast);
    } catch {
      setError(t.authInvalidCode);
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError(t.authNameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        user?: AuthUser;
      };
      if (!res.ok || !data.ok || !data.user) {
        setError(t.authNameSaveFailed);
        return;
      }
      setUser(data.user);
      onToast?.(t.authNameSavedToast);
    } catch {
      setError(t.authNameSaveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    setStep("idle");
    setEmail("");
    setCode("");
    setDisplayName("");
    onToast?.(t.authSignedOutToast);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 overflow-hidden rounded-[26px] bg-gate-surface px-4 py-8 shadow-sm ring-1 ring-gate-line">
        <AppLogo size={48} />
        <p className="text-base font-bold text-gate-ink">{t.appTitle}</p>
      </div>
    );
  }

  if (user) {
    const nameDirty = displayName.trim() !== (user.name ?? "").trim();
    return (
      <div className="overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
        <div className="px-4 py-4">
          <p className="text-[15px] font-bold text-gate-ink">{t.authProfileTitle}</p>
          <p className="mt-1 break-all text-sm text-gate-muted">{user.email}</p>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-semibold text-gate-muted">
              {t.authNameLabel}
            </span>
            <input
              type="text"
              autoComplete="name"
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.authNamePlaceholder}
              className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm text-gate-ink outline-none focus:border-blue-400"
            />
          </label>
          <button
            type="button"
            disabled={busy || !displayName.trim() || !nameDirty}
            onClick={() => void saveName()}
            className="mt-2 w-full rounded-2xl bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
          >
            {busy ? t.authNameSaving : t.authNameSave}
          </button>
          {user.name && !nameDirty && (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold leading-relaxed text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">
              {t.authNameSavedHint}
            </p>
          )}
          {!user.name && (
            <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              {t.authNameNeededHint}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-gate-muted">
            {t.authProfileHint}
          </p>
          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleLogout()}
          className="flex min-h-[52px] w-full items-center border-t border-gate-line px-4 text-left text-[15px] font-semibold text-red-600 active:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:active:bg-red-500/10"
        >
          {t.authSignOut}
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px] bg-gate-surface shadow-sm ring-1 ring-gate-line">
      <div className="px-4 py-4">
        <p className="text-[15px] font-bold text-gate-ink">{t.authSignInTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-gate-muted">
          {t.authSignInHint}
        </p>

        {step === "idle" ? (
          <div className="mt-3 space-y-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.authEmailPlaceholder}
              className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-sm text-gate-ink outline-none focus:border-blue-400"
            />
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={() => void requestCode()}
              className="w-full rounded-2xl bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
            >
              {busy ? t.authSending : t.authSendCode}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gate-muted">
              {t.authCodeSentTo(email)}
            </p>
            <p className="text-[11px] leading-relaxed text-gate-muted">
              {t.authCheckSpamHint}
            </p>
            {devHint && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
                {t.authDevCodeHint(devHint)}
              </p>
            )}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={t.authCodePlaceholder}
              className="w-full rounded-xl border border-gate-line bg-gate-bg px-3 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-gate-ink outline-none focus:border-blue-400"
            />
            <button
              type="button"
              disabled={busy || code.length !== 6}
              onClick={() => void verifyCode()}
              className="w-full rounded-2xl bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600 disabled:opacity-45"
            >
              {busy ? t.authVerifying : t.authVerifyCode}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("idle");
                setCode("");
                setDevHint(null);
                setError(null);
              }}
              className="w-full py-2 text-sm font-semibold text-gate-muted"
            >
              {t.authChangeEmail}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
