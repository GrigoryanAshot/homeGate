import type { GateCommand, GateState } from "@/lib/smartgate/types";
import {
  IconChevronDown,
  IconChevronUp,
  IconStop,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";
import { RollupDoorVisualizer } from "./RollupDoorVisualizer";

const stateBadgeStyle: Record<GateState, string> = {
  closed: "border-slate-300 bg-slate-100 text-slate-800",
  open: "border-green-300 bg-green-50 text-green-800",
  opening: "border-amber-300 bg-amber-50 text-amber-800",
  closing: "border-amber-300 bg-amber-50 text-amber-800",
  stopped: "border-red-300 bg-red-50 text-red-800",
  unknown: "border-slate-300 bg-slate-50 text-slate-600",
};

export function GateControlPanel({
  gateState,
  onCommand,
  controlsEnabled = true,
}: {
  busy?: boolean;
  gateState: GateState;
  onCommand: (command: GateCommand) => void;
  /** False while MQTT is connecting / offline — buttons do nothing. */
  controlsEnabled?: boolean;
}) {
  const { t } = useLocale();
  const disabled = !controlsEnabled;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col px-2 py-1">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div
            className={cn(
              "mb-2 w-full max-w-[min(78vw,280px)] shrink-0 rounded-lg border px-3 py-2 text-center text-sm font-bold",
              stateBadgeStyle[gateState],
            )}
            aria-live="polite"
          >
            {t.gateStates[gateState]}
          </div>
          <RollupDoorVisualizer state={gateState} />
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-col gap-2.5 pb-1 transition-opacity",
          disabled && "opacity-45",
        )}
      >
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCommand("OPEN")}
            className="control-btn-primary flex min-h-[72px] flex-col items-center justify-center gap-1 px-3 active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100"
          >
            <IconChevronUp className="h-8 w-8" />
            <span className="text-base font-bold">{t.open}</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onCommand("CLOSE")}
            className="control-btn-secondary flex min-h-[72px] flex-col items-center justify-center gap-1 px-3 active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100"
          >
            <IconChevronDown className="h-8 w-8" />
            <span className="text-base font-bold">{t.close}</span>
          </button>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onCommand("STOP")}
          className="control-btn-danger flex min-h-[52px] w-full items-center justify-center gap-2 px-4 active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100"
        >
          <IconStop className="h-5 w-5" />
          <span className="text-base font-bold">{t.stop}</span>
        </button>
      </div>
    </div>
  );
}
