import type { ControllerAccessRule } from "./types";
import type { Locale } from "./i18n";

type AccessLabels = {
  unlimited: string;
  once: string;
  until: (date: string) => string;
  range: (from: string, to: string) => string;
  hours1: string;
  hours24: string;
  hours168: string;
};

const hyLabels: AccessLabels = {
  unlimited: "Անսահմանա",
  once: "Մեկ անգամ",
  until: (d) => `Մինչև ${d}`,
  range: (a, b) => `${a} – ${b}`,
  hours1: "1 ժամ",
  hours24: "24 ժամ",
  hours168: "7 օր",
};

const enLabels: AccessLabels = {
  unlimited: "Unlimited",
  once: "One-time",
  until: (d) => `Until ${d}`,
  range: (a, b) => `${a} – ${b}`,
  hours1: "1 hour",
  hours24: "24 hours",
  hours168: "7 days",
};

const ruLabels: AccessLabels = {
  unlimited: "Без ограничений",
  once: "Один раз",
  until: (d) => `До ${d}`,
  range: (a, b) => `${a} – ${b}`,
  hours1: "1 час",
  hours24: "24 часа",
  hours168: "7 дней",
};

function localeTag(locale: Locale) {
  if (locale === "hy") return "hy-AM";
  if (locale === "ru") return "ru-RU";
  return "en-GB";
}

function fmtDateTime(ts: number, locale: Locale) {
  return new Date(ts).toLocaleString(localeTag(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(ts: number, locale: Locale) {
  return new Date(ts).toLocaleDateString(localeTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatControllerAccess(
  rule: ControllerAccessRule,
  locale: Locale,
): string {
  const L =
    locale === "hy" ? hyLabels : locale === "ru" ? ruLabels : enLabels;

  if (rule.type === "unlimited") return L.unlimited;
  if (rule.type === "once") return L.once;
  if (rule.type === "range" && rule.rangeFrom && rule.rangeTo) {
    return L.range(
      fmtDateTime(rule.rangeFrom, locale),
      fmtDateTime(rule.rangeTo, locale),
    );
  }
  if (rule.type === "hours") {
    if (rule.durationMs === 3600000) return L.hours1;
    if (rule.durationMs === 86400000) return L.hours24;
    if (rule.durationMs === 7 * 86400000) return L.hours168;
    if (rule.expiresAt) return L.until(fmtDate(rule.expiresAt, locale));
  }
  if (rule.expiresAt) return L.until(fmtDate(rule.expiresAt, locale));
  return L.unlimited;
}

export function formatHistoryWhen(ts: number, locale: Locale): string {
  const d = new Date(ts);
  return d.toLocaleString(localeTag(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
