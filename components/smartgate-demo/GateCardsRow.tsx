"use client";

import { cn } from "@/lib/utils";
import { IconGate } from "@/components/ui/icons";
import { useGates } from "./GatesProvider";
import { useLocale } from "./LocaleProvider";

export function GateCardsRow({ onAddGate }: { onAddGate: () => void }) {
  const { gates, selectedGateId, selectGate } = useGates();
  const { t } = useLocale();

  return (
    <div className="shrink-0 pb-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gate-muted">
        {t.myGates}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {gates.map((gate) => {
          const selected = gate.id === selectedGateId;
          return (
            <button
              key={gate.id}
              type="button"
              onClick={() => selectGate(gate.id)}
              className={cn(
                "flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-3 text-center transition active:scale-[0.98]",
                selected
                  ? "border-blue-400 bg-blue-50 shadow-sm"
                  : "border-gate-line bg-white hover:border-blue-200 hover:bg-blue-50/40",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  selected
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-gate-muted",
                )}
              >
                <IconGate className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-sm font-bold leading-tight text-gate-ink">
                {gate.name}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddGate}
          aria-label={t.addGate}
          className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-3 py-3 text-blue-700 transition active:scale-[0.98] active:bg-blue-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-400 text-2xl font-light leading-none">
            +
          </span>
          <span className="text-xs font-bold">{t.addGate}</span>
        </button>
      </div>
    </div>
  );
}

export function PresentationBadge() {
  const { t } = useLocale();
  return (
    <div className="shrink-0 border-b border-blue-200 bg-blue-600 px-4 py-1.5 text-center text-[0.65rem] font-bold uppercase tracking-wider text-white">
      {t.presentationBadge}
    </div>
  );
}
