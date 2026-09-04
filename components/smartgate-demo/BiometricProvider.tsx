"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BIOMETRIC_BACKGROUND_RELOCK_MS,
  clearBiometricSession,
  disableBiometric as disableBiometricStorage,
  isPlatformAuthenticatorAvailable,
  markBiometricSessionUnlocked,
  readBiometricEnabled,
  readBiometricSessionUnlocked,
  registerBiometric,
  verifyBiometric,
  type BiometricResult,
} from "@/lib/smartgate/biometric";

type BiometricContextValue = {
  ready: boolean;
  supported: boolean;
  enabled: boolean;
  unlocked: boolean;
  locked: boolean;
  busy: boolean;
  enable: () => Promise<BiometricResult>;
  disable: () => Promise<void>;
  unlock: () => Promise<BiometricResult>;
  /** When enabled, prompts Face ID / fingerprint. Always prompts for share. */
  requireAuth: (opts?: { force?: boolean }) => Promise<BiometricResult>;
};

const BiometricContext = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const platformOk = await isPlatformAuthenticatorAvailable();
      if (cancelled) return;
      const on = readBiometricEnabled();
      setSupported(platformOk);
      setEnabled(on);
      setUnlocked(!on || readBiometricSessionUnlocked());
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !enabled) return;

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;
      if (Date.now() - hiddenAt >= BIOMETRIC_BACKGROUND_RELOCK_MS) {
        clearBiometricSession();
        setUnlocked(false);
      }
    }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted && enabled) {
        clearBiometricSession();
        setUnlocked(false);
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [ready, enabled]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await registerBiometric();
      if (result.ok) {
        setEnabled(true);
        setUnlocked(true);
        setSupported(true);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await disableBiometricStorage();
      setEnabled(false);
      setUnlocked(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const unlock = useCallback(async () => {
    setBusy(true);
    try {
      const result = await verifyBiometric();
      if (result.ok) {
        markBiometricSessionUnlocked();
        setUnlocked(true);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const requireAuth = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!enabled) return { ok: true } as BiometricResult;
      if (!opts?.force && unlocked) return { ok: true } as BiometricResult;
      return unlock();
    },
    [enabled, unlocked, unlock],
  );

  const value = useMemo(
    () => ({
      ready,
      supported,
      enabled,
      unlocked,
      locked: ready && enabled && !unlocked,
      busy,
      enable,
      disable,
      unlock,
      requireAuth,
    }),
    [
      ready,
      supported,
      enabled,
      unlocked,
      busy,
      enable,
      disable,
      unlock,
      requireAuth,
    ],
  );

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error("useBiometric must be used within BiometricProvider");
  return ctx;
}
