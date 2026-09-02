"use client";

import { localeLabels, SUPPORTED_LOCALES } from "@/lib/smartgate/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

export function InviteLocaleBar() {
  const { locale, setLocale } = useLocale();
  const locales = SUPPORTED_LOCALES;

  return (
    <div className="flex shrink-0 justify-end gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold transition",
            locale === loc
              ? "bg-blue-500 text-white"
              : "border border-gate-line bg-white text-gate-muted",
          )}
        >
          {loc.toUpperCase()}
        </button>
      ))}
      <span className="sr-only">{localeLabels[locale]}</span>
    </div>
  );
}
