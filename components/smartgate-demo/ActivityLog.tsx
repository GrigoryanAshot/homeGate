import { IconActivity } from "@/components/ui/icons";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import type { ActivityEvent } from "@/lib/smartgate/types";
import { formatRelativeTime } from "@/lib/smartgate/types";

function inferAction(message: string): string {
  const upper = message.toUpperCase();
  if (upper.includes("OPEN")) return "OPEN";
  if (upper.includes("CLOSE")) return "CLOSE";
  if (upper.includes("STOP") || upper.includes("HOLD")) return "STOP";
  if (upper.includes("CONNECT")) return "CONNECT";
  if (upper.includes("REVOKE")) return "STOP";
  if (upper.includes("QR") || upper.includes("PASS")) return "CONNECT";
  return "DISCONNECT";
}

const actionStyles: Record<string, string> = {
  OPEN: "text-green-800 border-green-200 bg-green-50",
  CLOSE: "text-blue-800 border-blue-200 bg-blue-50",
  STOP: "text-red-800 border-red-200 bg-red-50",
  CONNECT: "text-blue-800 border-blue-200 bg-blue-50",
  DISCONNECT: "text-slate-600 border-slate-200 bg-slate-50",
};

export function ActivityLog({ events }: { events: ActivityEvent[] }) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        kicker="Audit trail"
        title="Activity Log"
        description="Command history and connection events from this session."
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-gate-muted">
            <IconActivity className="h-3.5 w-3.5" />
            {events.length} events
          </span>
        }
      />

      <div className="relative z-[1] max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gate-line bg-slate-50 py-12 text-center">
            <IconActivity className="mb-3 h-8 w-8 text-gate-muted/40" />
            <p className="text-sm text-gate-muted">No activity yet</p>
            <p className="mt-1 text-xs text-gate-muted/70">
              Commands and connection changes appear here
            </p>
          </div>
        ) : (
          events.map((entry) => {
            const action = inferAction(entry.message);
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-gate-line bg-white px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/30"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-lg border px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wide ${actionStyles[action] ?? actionStyles.DISCONNECT}`}
                >
                  {action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gate-ink">{entry.message}</p>
                  <p className="mt-0.5 font-mono text-[0.65rem] text-gate-muted">
                    {formatRelativeTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
