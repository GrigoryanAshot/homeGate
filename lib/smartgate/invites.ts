import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { Locale } from "./i18n";
import type { ControllerAccessRule } from "./types";
import {
  accessNotStartedYet,
  isAccessActive,
  type InvitePayload,
} from "./access";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://home-gate-seven.vercel.app";

function inviteSecret() {
  return (
    process.env.INVITE_SECRET ??
    process.env.NEXT_PUBLIC_INVITE_SECRET ??
    "dev-only-change-invite-secret-in-production"
  );
}

function sign(data: string): string {
  return createHmac("sha256", inviteSecret()).update(data).digest("base64url");
}

export function createInviteToken(input: {
  gateId: string;
  name: string;
  rule: ControllerAccessRule;
  id?: string;
}): string {
  const payload: InvitePayload = {
    v: 1,
    id: input.id ?? randomBytes(12).toString("base64url"),
    gateId: input.gateId,
    name: input.name.trim(),
    rule: input.rule,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyInviteToken(token: string): InvitePayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(data);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as InvitePayload;
    if (payload.v !== 1 || !payload.id || !payload.gateId || !payload.name) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildInviteUrl(token: string): string {
  const base = APP_URL.replace(/\/$/, "");
  return `${base}/invite/${encodeURIComponent(token)}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildInviteWhatsAppMessage(
  locale: Locale,
  name: string,
  url: string,
): string {
  if (locale === "hy") {
    return `Ողջու՜յն ${name}։\nՍա քո դարպասի հղումն է — բացիր և փակիր այստեղից.\n${url}`;
  }
  if (locale === "ru") {
    return `Здравствуйте, ${name}!\nВаша ссылка на ворота — открывайте и закрывайте отсюда.\n${url}`;
  }
  return `Hi ${name}!\nHere is your gate link — open and close from your phone.\n${url}`;
}

export type InviteVerifyResult =
  | { ok: true; payload: InvitePayload }
  | {
      ok: false;
      reason: "invalid" | "expired" | "not_started" | "used" | "other_device";
    };

const usedInviteIds = new Set<string>();

export function markInviteUsed(id: string) {
  usedInviteIds.add(id);
}

export function isInviteUsed(id: string) {
  return usedInviteIds.has(id);
}

export function verifyInviteAccess(token: string): InviteVerifyResult {
  const payload = verifyInviteToken(token);
  if (!payload) return { ok: false, reason: "invalid" };

  if (payload.rule.type === "once" && isInviteUsed(payload.id)) {
    return { ok: false, reason: "used" };
  }

  if (accessNotStartedYet(payload.rule)) {
    return { ok: false, reason: "not_started" };
  }

  if (!isAccessActive(payload.rule)) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}
