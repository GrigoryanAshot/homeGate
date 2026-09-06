"use client";

import { useLocale } from "./LocaleProvider";

export function WifiSetupGuide({ compact }: { compact?: boolean }) {
  const { t } = useLocale();

  const steps = [
    t.wifiSetupStep1,
    t.wifiSetupStep2,
    t.wifiSetupStep3,
    t.wifiSetupStep4,
    t.wifiSetupStep5,
  ];

  return (
    <div
      className={
        compact
          ? "space-y-2"
          : "space-y-3 rounded-[22px] bg-gate-card/80 p-4 ring-1 ring-gate-line"
      }
    >
      {!compact && (
        <div>
          <p className="text-[15px] font-bold text-gate-ink">{t.wifiSetupTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-gate-muted">
            {t.wifiSetupIntro}
          </p>
        </div>
      )}
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gate-ink">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-gate-muted">{t.wifiSetupReset}</p>
    </div>
  );
}
