"use client";

import { IconGate, IconQr } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

export type DemoView = "control" | "share";

export function DemoViewTabs({
  active,
  onChange,
}: {
  active: DemoView;
  onChange: (view: DemoView) => void;
}) {
  const { t } = useLocale();

  const tabs: {
    id: DemoView;
    label: string;
    hint: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "control",
      label: t.tabControl,
      hint: t.tabControlHint,
      icon: <IconGate className="h-6 w-6" />,
    },
    {
      id: "share",
      label: t.tabShare,
      hint: t.tabShareHint,
      icon: <IconQr className="h-6 w-6" />,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label={t.tabControl}
      className="grid grid-cols-2 gap-3"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-[1] flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[22px] border px-4 py-4 text-center transition-all sm:min-h-[80px] sm:flex-row sm:gap-3 sm:text-left",
              selected
                ? "border-blue-300 bg-blue-50 text-gate-ink shadow-gate-sm ring-2 ring-blue-200"
                : "border-gate-line bg-white text-gate-muted hover:border-blue-200 hover:bg-blue-50/50 hover:text-gate-ink",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                selected
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-gate-muted",
              )}
            >
              {tab.icon}
            </span>
            <span>
              <span className="block text-base font-bold sm:text-lg">
                {tab.label}
              </span>
              <span className="block text-xs font-normal opacity-80">
                {tab.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
