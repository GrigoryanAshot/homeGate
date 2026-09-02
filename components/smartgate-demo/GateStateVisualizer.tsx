import { type GateState } from "@/lib/smartgate/types";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/primitives";

const curtainHeights: Record<GateState, string> = {
  closed: "h-[88%]",
  closing: "h-[55%]",
  stopped: "h-[42%]",
  opening: "h-[28%]",
  open: "h-[12%]",
  unknown: "h-[88%]",
};

export function GateStateVisualizer({
  state,
  compact = false,
}: {
  state: GateState;
  compact?: boolean;
}) {
  const moving = state === "opening" || state === "closing";

  return (
    <GlassCard glow={state === "open" ? "ok" : "none"} className="h-full">
      {!compact && (
        <p className="relative z-[1] mb-4 text-center text-sm text-gate-muted">
          This picture shows your gate
        </p>
      )}

      <div className="relative z-[1] overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-sky-50 to-white p-4 md:p-5">
        <div className="relative mx-auto max-w-[260px]">
          <div className="relative h-48 overflow-hidden rounded-2xl border-[4px] border-slate-300 bg-slate-100 shadow-gate-sm md:h-52">
            <div className="absolute inset-x-0 top-0 h-6 rounded-b-lg bg-gradient-to-b from-slate-400 to-slate-500" />
            <div className="absolute inset-x-3 top-7 bottom-3 overflow-hidden rounded-lg bg-slate-200">
              <div
                className={cn(
                  "absolute inset-x-0 top-0 origin-top transition-all duration-[2.4s] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  curtainHeights[state],
                )}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="mx-1 mb-1.5 h-4 rounded-sm bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400"
                    style={{ opacity: 1 - i * 0.04 }}
                  />
                ))}
              </div>
            </div>
            {moving && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse-soft" />
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
