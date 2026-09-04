/** Client-side WebAuthn (Face ID / fingerprint / Windows Hello). */

export const BIOMETRIC_ENABLED_KEY = "smartgate-biometric-enabled";
export const BIOMETRIC_CREDENTIAL_KEY = "smartgate-biometric-cred";
export const BIOMETRIC_SESSION_KEY = "smartgate-biometric-unlocked";

/** Re-lock after the app was in the background this long (ms). */
export const BIOMETRIC_BACKGROUND_RELOCK_MS = 20_000;

const RP_NAME = "Touch SmartGate";

export function isBiometricApiAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function" &&
    typeof navigator.credentials?.get === "function"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricApiAvailable()) return false;
  try {
    if (
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
    ) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function readBiometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "1";
}

export function storeBiometricEnabled(enabled: boolean) {
  window.localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? "1" : "0");
  if (!enabled) {
    window.localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    clearBiometricSession();
  }
}

export function readBiometricSessionUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(BIOMETRIC_SESSION_KEY) === "1";
}

export function markBiometricSessionUnlocked() {
  window.sessionStorage.setItem(BIOMETRIC_SESSION_KEY, "1");
}

export function clearBiometricSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(BIOMETRIC_SESSION_KEY);
}

function randomChallenge(size = 32): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(size);
  crypto.getRandomValues(buf);
  return buf;
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]!);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function rpId(): string {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? host : host;
}

export type BiometricResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "cancelled" | "failed" };

export async function registerBiometric(): Promise<BiometricResult> {
  if (!(await isPlatformAuthenticatorAvailable())) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const userId = new TextEncoder().encode("smartgate-owner");
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: RP_NAME, id: rpId() },
        user: {
          id: userId,
          name: "smartgate-owner",
          displayName: "Touch SmartGate",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 90_000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, reason: "cancelled" };

    window.localStorage.setItem(
      BIOMETRIC_CREDENTIAL_KEY,
      toBase64Url(credential.rawId),
    );
    storeBiometricEnabled(true);
    markBiometricSessionUnlocked();
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "failed" };
  }
}

export async function verifyBiometric(): Promise<BiometricResult> {
  if (!readBiometricEnabled()) return { ok: true };
  if (!(await isPlatformAuthenticatorAvailable())) {
    return { ok: false, reason: "unsupported" };
  }

  const storedId = window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  if (!storedId) return { ok: false, reason: "failed" };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        rpId: rpId(),
        allowCredentials: [
          {
            type: "public-key",
            id: fromBase64Url(storedId),
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 90_000,
      },
    });

    if (!assertion) return { ok: false, reason: "cancelled" };
    markBiometricSessionUnlocked();
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "failed" };
  }
}

export async function disableBiometric(): Promise<void> {
  storeBiometricEnabled(false);
}
