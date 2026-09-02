"use client";

import { IconGate, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLocale } from "./LocaleProvider";

export type DemoView = "control" | "controllers";

export function BottomNav({
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
    icon: React.ReactNode;
  }[] = [
    {
      id: "control",
      label: t.tabControl,
      icon: <IconGate className="h-6 w-6" />,
    },
    {
      id: "controllers",
      label: t.tabShare,
      icon: <IconUsers className="h-6 w-6" />,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label={t.tabControl}
      className="shrink-0 border-t border-gate-line bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-1">
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
                "flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 transition",
                selected
                  ? "bg-blue-50 text-gate-gold"
                  : "text-gate-muted active:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  selected ? "bg-blue-500 text-white" : "bg-transparent",
                )}
              >
                {tab.icon}
              </span>
              <span className="text-[0.7rem] font-bold leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
