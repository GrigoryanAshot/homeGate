import { SettingsMenu } from "./SettingsMenu";
import { useLocale } from "./LocaleProvider";
import { AppLogo } from "@/components/ui/AppLogo";
import type { GateState } from "@/lib/smartgate/types";

export function DemoHeader({
  gateState,
  settingsOpen,
  onSettingsOpenChange,
  onToast,
  onMqttSaved,
  onWifiReset,
  mqttOnline = false,
}: {
  gateState: GateState;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onToast?: (message: string) => void;
  onMqttSaved?: () => void;
  onWifiReset?: () => boolean;
  mqttOnline?: boolean;
}) {
  const { t } = useLocale();

  return (
    <header className="relative z-10 shrink-0 border-b border-gate-line bg-gate-surface/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gate-line bg-gate-surface p-1.5 shadow-sm">
            <AppLogo size={40} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gate-ink">
              {t.appTitle}
            </h1>
            <p className="truncate text-xs text-gate-muted">
              {t.gateStates[gateState]}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <SettingsMenu
            open={settingsOpen}
            onOpenChange={onSettingsOpenChange}
            onToast={onToast}
            onMqttSaved={onMqttSaved}
            onWifiReset={onWifiReset}
            mqttOnline={mqttOnline}
          />
        </div>
      </div>
    </header>
  );
}
