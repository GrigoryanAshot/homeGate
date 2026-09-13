import { prisma } from "@/lib/db/client";
import {
  generateOtp,
  hashOtp,
  isValidEmail,
  normalizeEmail,
  otpHashesMatch,
  type SessionUser,
} from "./session";
import { sendLoginCodeEmail } from "./email";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45_000;

export async function requestLoginCode(rawEmail: string): Promise<
  | { ok: true; email: string; devCode?: string }
  | { ok: false; error: "invalid_email" | "rate_limited" | "send_failed" }
> {
  if (!isValidEmail(rawEmail)) return { ok: false, error: "invalid_email" };
  const email = normalizeEmail(rawEmail);

  const latest = await prisma.emailLoginCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    return { ok: false, error: "rate_limited" };
  }

  await prisma.emailLoginCode.deleteMany({
    where: { email, expiresAt: { lt: new Date() } },
  });

  const code = generateOtp();
  await prisma.emailLoginCode.create({
    data: {
      email,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const sent = await sendLoginCodeEmail(email, code);
  if (!sent.ok) return { ok: false, error: "send_failed" };

  return {
    ok: true,
    email,
    ...(sent.devCode ? { devCode: sent.devCode } : {}),
  };
}

export async function verifyLoginCode(
  rawEmail: string,
  code: string,
): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; error: "invalid_email" | "invalid_code" }
> {
  if (!isValidEmail(rawEmail)) return { ok: false, error: "invalid_email" };
  const email = normalizeEmail(rawEmail);
  const trimmed = code.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return { ok: false, error: "invalid_code" };

  const row = await prisma.emailLoginCode.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row || !otpHashesMatch(trimmed, row.codeHash)) {
    return { ok: false, error: "invalid_code" };
  }

  await prisma.emailLoginCode.deleteMany({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
