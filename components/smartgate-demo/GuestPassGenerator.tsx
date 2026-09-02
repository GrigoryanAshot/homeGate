"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconCopy } from "@/components/ui/icons";
import type { GuestPass, GuestPassDuration } from "@/lib/smartgate/types";
import { guestPassExpiryMs } from "@/lib/smartgate/types";
import {
  getGuestPassDurationHint,
  getGuestPassDurationLabel,
} from "@/lib/smartgate/i18n";
import { useLocale } from "./LocaleProvider";

function buildPass(duration: GuestPassDuration): GuestPass {
  const token = `SG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const expiresAt = Date.now() + guestPassExpiryMs(duration);
  return {
    id: crypto.randomUUID(),
    token,
    url: `https://gate.touchweb.am/guest?token=${token}&scope=open-once`,
    duration,
    expiresAt,
    oneTime: duration === "once",
  };
}

type ShareStep = "duration" | "send";

export function GuestPassGenerator({
  onGenerated,
}: {
  onGenerated?: (pass: GuestPass) => void;
}) {
  const { locale, t } = useLocale();
  const [step, setStep] = useState<ShareStep>("duration");
  const [duration, setDuration] = useState<GuestPassDuration>("24h");
  const [copied, setCopied] = useState(false);
  const [pass, setPass] = useState(() => buildPass("24h"));

  const durationOptions: GuestPassDuration[] = ["24h", "1h", "once"];

  function pickDuration(next: GuestPassDuration) {
    setDuration(next);
    const created = buildPass(next);
    setPass(created);
    onGenerated?.(created);
    setStep("send");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pass.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }

  if (step === "duration") {
    return (
      <div className="flex h-full min-h-0 flex-col px-1">
        <div className="shrink-0 pb-3 text-center">
          <h2 className="text-lg font-bold text-gate-ink">{t.shareTitle}</h2>
          <p className="mt-1 text-sm text-gate-muted">{t.step1}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
          {durationOptions.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pickDuration(key)}
              className="rounded-2xl border border-gate-line bg-white px-4 py-4 text-left active:bg-blue-50"
            >
              <span className="block text-base font-bold text-gate-ink">
                {getGuestPassDurationLabel(locale, key)}
              </span>
              <span className="block text-sm text-gate-muted">
                {getGuestPassDurationHint(locale, key)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-1">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setStep("duration")}
          className="rounded-xl border border-gate-line px-3 py-2 text-sm font-semibold text-gate-muted active:bg-slate-50"
        >
          ← {t.back}
        </button>
        <p className="text-sm font-bold text-gate-ink">{t.step2}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border-4 border-white bg-white p-2 shadow-gate-sm">
          <QRCodeSVG
            value={pass.url}
            size={148}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0f1419"
          />
        </div>
        <p className="max-w-[240px] text-center text-xs text-gate-muted">
          {t.qrHint}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="control-btn-primary flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 px-5 text-base font-bold"
        >
          <IconCopy className="h-5 w-5" />
          {copied ? t.copiedLink : t.copyLink}
        </button>
        <p className="max-w-xs text-center text-[0.7rem] leading-snug text-sky-800">
          {t.whatsappTip}
        </p>
      </div>
    </div>
  );
}
