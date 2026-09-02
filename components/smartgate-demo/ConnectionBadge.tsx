import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

type BadgeVariant = "online" | "connecting" | "offline";

const variantStyles: Record<
  BadgeVariant,
  { dot: string; ring: string; bg: string; text: string }
> = {
  online: {
    dot: "bg-gate-ok",
    ring: "shadow-[0_0_0_3px_rgba(22,163,74,0.25)]",
    bg: "border-green-200 bg-green-50",
    text: "text-green-800",
  },
  connecting: {
    dot: "bg-gate-waiting animate-pulse-soft",
    ring: "shadow-[0_0_0_3px_rgba(245,158,11,0.25)]",
    bg: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
  },
  offline: {
    dot: "bg-gate-danger",
    ring: "shadow-[0_0_0_3px_rgba(239,68,68,0.25)]",
    bg: "border-red-200 bg-red-50",
    text: "text-red-800",
  },
};

export function ConnectionBadge({
  status,
  mockMode,
  presentationMode,
}: {
  status: BadgeVariant;
  mockMode?: boolean;
  presentationMode?: boolean;
}) {
  const { t } = useLocale();
  const v = variantStyles[status];

  const label = presentationMode
    ? t.connected
    : mockMode && status === "online"
      ? t.practiceMode
      : status === "online"
        ? t.connected
        : status === "connecting"
          ? t.connecting
          : t.offline;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold sm:px-3 sm:py-1.5 sm:text-xs",
        v.bg,
        v.text,
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full", v.dot, v.ring)}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
