import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/smartgate/types";
import { useLocale } from "./LocaleProvider";

const ledStyles: Record<ConnectionStatus, string> = {
  online: "bg-green-500 shadow-[0_0_7px_2px_rgba(34,197,94,0.7)]",
  connecting: "bg-amber-400 shadow-[0_0_7px_2px_rgba(245,158,11,0.7)]",
  offline: "bg-red-500 shadow-[0_0_7px_2px_rgba(239,68,68,0.7)]",
};

const labelStyles: Record<ConnectionStatus, string> = {
  online: "text-green-700",
  connecting: "text-amber-700",
  offline: "text-red-700",
};

export function ConnectionLed({
  status,
  className,
  showLabel = false,
}: {
  status: ConnectionStatus;
  className?: string;
  /** Show status text next to the LED (e.g. «Միանում է»). */
  showLabel?: boolean;
}) {
  const { t } = useLocale();
  const label =
    status === "online"
      ? t.connected
      : status === "connecting"
        ? t.connecting
        : t.offline;

  if (!showLabel) {
    return (
      <span
        role="status"
        title={label}
        aria-label={label}
        className={cn(
          "inline-block h-2.5 w-2.5 shrink-0 rounded-full animate-led-blink",
          ledStyles[status],
          className,
        )}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "pointer-events-none inline-flex max-w-[9.5rem] items-center gap-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 shrink-0 rounded-full animate-led-blink",
          ledStyles[status],
        )}
      />
      <span
        className={cn(
          "truncate text-[0.65rem] font-semibold leading-tight",
          labelStyles[status],
        )}
      >
        {label}
      </span>
    </span>
  );
}
