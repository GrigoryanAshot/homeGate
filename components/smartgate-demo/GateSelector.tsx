"use client";

import { cn } from "@/lib/utils";
import { DEMO_GATES, type DemoGateId } from "@/lib/smartgate/presentation";
import { useLocale } from "./LocaleProvider";

export function GateSelector({
  value,
  onChange,
}: {
  value: DemoGateId;
  onChange: (id: DemoGateId) => void;
}) {
  const { locale, t } = useLocale();

  return (
    <div className="border-b border-gate-line bg-blue-50/60 px-4 py-2">
      <label className="flex items-center gap-2">
        <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-gate-muted">
          {t.selectGate}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DemoGateId)}
          className="min-w-0 flex-1 rounded-xl border border-gate-line bg-white px-3 py-2 text-sm font-semibold text-gate-ink outline-none ring-blue-400 focus:ring-2"
        >
          {DEMO_GATES.map((gate) => (
            <option key={gate.id} value={gate.id}>
              {locale === "hy"
                ? gate.labelHy
                : locale === "ru"
                  ? gate.labelRu
                  : gate.labelEn}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function PresentationBadge() {
  const { t } = useLocale();
  return (
    <div
      className={cn(
        "shrink-0 border-b border-blue-200 bg-blue-600 px-4 py-1.5 text-center text-[0.65rem] font-bold uppercase tracking-wider text-white",
      )}
    >
      {t.presentationBadge}
    </div>
  );
}
