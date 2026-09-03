"use client";

import { IconChevronLeft } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

export function BackButton({
  onClick,
  className,
  showLabel = true,
}: {
  onClick: () => void;
  className?: string;
  showLabel?: boolean;
}) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t.back}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-bold text-gate-ink transition active:scale-[0.97]",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gate-surface text-gate-ink shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-gate-line transition group-active:bg-gate-card dark:shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        <IconChevronLeft className="h-5 w-5" />
      </span>
      {showLabel && (
        <span className="pr-1 text-gate-muted group-active:text-gate-ink">
          {t.back}
        </span>
      )}
    </button>
  );
}
