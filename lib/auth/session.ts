import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "smartgate_session";
const SESSION_DAYS = 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

function authSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.INVITE_SECRET ||
    "dev-only-change-auth-secret"
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  // Any provider: Gmail, iCloud, Outlook, custom domain, etc.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function hashOtp(code: string): string {
  return createHash("sha256")
    .update(`${authSecret()}:${code}`, "utf8")
    .digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function otpHashesMatch(code: string, codeHash: string): boolean {
  const a = Buffer.from(hashOtp(code), "utf8");
  const b = Buffer.from(codeHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", authSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = signPayload(payload);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionUser & { exp: number };
    if (!data?.id || !data?.email || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return { id: data.id, email: data.email, name: data.name ?? null };
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
