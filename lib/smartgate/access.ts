import type { ControllerAccessRule } from "./types";

export interface InvitePayload {
  v: 1;
  id: string;
  gateId: string;
  name: string;
  rule: ControllerAccessRule;
}

export function isAccessActive(rule: ControllerAccessRule, now = Date.now()): boolean {
  if (rule.type === "unlimited") return true;
  if (rule.type === "once") {
    if (rule.expiresAt && now > rule.expiresAt) return false;
    return true;
  }
  if (rule.type === "hours") {
    return rule.expiresAt ? now <= rule.expiresAt : true;
  }
  if (rule.type === "range") {
    const from = rule.rangeFrom ?? 0;
    const to = rule.rangeTo ?? rule.expiresAt ?? 0;
    return now >= from && now <= to;
  }
  if (rule.expiresAt) return now <= rule.expiresAt;
  return true;
}

export function accessNotStartedYet(rule: ControllerAccessRule, now = Date.now()): boolean {
  if (rule.type === "range" && rule.rangeFrom) {
    return now < rule.rangeFrom;
  }
  return false;
}
