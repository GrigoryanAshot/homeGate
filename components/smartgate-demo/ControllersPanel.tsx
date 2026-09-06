"use client";

import { useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconActivity, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  buildInviteWhatsAppMessage,
  buildWhatsAppShareUrl,
} from "@/lib/smartgate/invites";
import {
  formatControllerAccess,
  formatHistoryWhen,
} from "@/lib/smartgate/controllers";
import type { ControllerAccessRule, GateController } from "@/lib/smartgate/types";
import {
  SEED_ACCESS_HISTORY,
  SEED_CONTROLLERS,
} from "@/lib/smartgate/types";
import { useLocale } from "./LocaleProvider";
import { useGates } from "./GatesProvider";
import { AlarmWheelTimePicker, TIME_NOW } from "./WheelTimePicker";
import { BackButton } from "./BackButton";

type PanelView = "list" | "add" | "edit" | "history" | "share";

type RulePreset = "unlimited" | "once" | "1h" | "24h" | "7d" | "range";

const TIME_STEP_MIN = 15;

function localDateValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekFromNowDateValue() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return localDateValue(d);
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number) {
  const clamped = Math.min(Math.max(mins, 0), 23 * 60 + 45);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function combineDateAndTime(dateStr: string, time: string): number {
  if (time === TIME_NOW) return Date.now();
  const [y, mo, da] = dateStr.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, mo - 1, da, h, m, 0, 0).getTime();
}

function buildRule(
  preset: RulePreset,
  rangeFrom?: string,
  rangeFromTime?: string,
  rangeTo?: string,
  rangeToTime?: string,
): ControllerAccessRule {
  const now = Date.now();
  switch (preset) {
    case "unlimited":
      return { type: "unlimited" };
    case "once":
      return { type: "once" };
    case "1h":
      return {
        type: "hours",
        durationMs: 3600000,
        expiresAt: now + 3600000,
      };
    case "24h":
      return {
        type: "hours",
        durationMs: 86400000,
        expiresAt: now + 86400000,
      };
    case "7d":
      return {
        type: "hours",
        durationMs: 7 * 86400000,
        expiresAt: now + 7 * 86400000,
      };
    case "range": {
      const fromTs =
        rangeFrom && rangeFromTime
          ? combineDateAndTime(rangeFrom, rangeFromTime)
          : now;
      const toTs =
        rangeTo && rangeToTime
          ? combineDateAndTime(rangeTo, rangeToTime)
          : now + 86400000;
      return {
        type: "range",
        rangeFrom: fromTs,
        rangeTo: toTs,
        expiresAt: toTs,
      };
    }
  }
}

function timestampToDateValue(ts: number) {
  return localDateValue(new Date(ts));
}

function timestampToTimeValue(ts: number) {
  const d = new Date(ts);
  return minutesToTime(d.getHours() * 60 + d.getMinutes());
}

function ruleToFormState(rule: ControllerAccessRule): {
  preset: RulePreset;
  rangeFrom: string;
  rangeTo: string;
  rangeFromTime: string;
  rangeToTime: string;
} {
  if (rule.type === "unlimited") {
    return {
      preset: "unlimited",
      rangeFrom: localDateValue(),
      rangeTo: weekFromNowDateValue(),
      rangeFromTime: TIME_NOW,
      rangeToTime: "23:45",
    };
  }
  if (rule.type === "once") {
    return {
      preset: "once",
      rangeFrom: localDateValue(),
      rangeTo: weekFromNowDateValue(),
      rangeFromTime: TIME_NOW,
      rangeToTime: "23:45",
    };
  }
  if (rule.type === "hours") {
    let preset: RulePreset = "24h";
    if (rule.durationMs === 3600000) preset = "1h";
    else if (rule.durationMs === 86400000) preset = "24h";
    else if (rule.durationMs === 7 * 86400000) preset = "7d";
    return {
      preset,
      rangeFrom: localDateValue(),
      rangeTo: weekFromNowDateValue(),
      rangeFromTime: TIME_NOW,
      rangeToTime: "23:45",
    };
  }
  if (rule.type === "range" && rule.rangeFrom && rule.rangeTo) {
    return {
      preset: "range",
      rangeFrom: timestampToDateValue(rule.rangeFrom),
      rangeTo: timestampToDateValue(rule.rangeTo),
      rangeFromTime: timestampToTimeValue(rule.rangeFrom),
      rangeToTime: timestampToTimeValue(rule.rangeTo),
    };
  }
  return {
    preset: "unlimited",
    rangeFrom: localDateValue(),
    rangeTo: weekFromNowDateValue(),
    rangeFromTime: TIME_NOW,
    rangeToTime: "23:45",
  };
}

export function ControllersPanel({
  onToast,
}: {
  onToast?: (message: string) => void;
}) {
  const { locale, t } = useLocale();
  const { selectedGateId } = useGates();
  const [panelView, setPanelView] = useState<PanelView>("list");
  const [controllers, setControllers] = useState<GateController[]>(() => [
    ...SEED_CONTROLLERS,
  ]);
  const history = SEED_ACCESS_HISTORY;

  const [name, setName] = useState("");
  const [preset, setPreset] = useState<RulePreset>("unlimited");
  const [rangeFrom, setRangeFrom] = useState(localDateValue);
  const [rangeTo, setRangeTo] = useState(weekFromNowDateValue);
  const [rangeFromTime, setRangeFromTime] = useState(TIME_NOW);
  const [rangeToTime, setRangeToTime] = useState("23:45");
  const [shareUrl, setShareUrl] = useState("");
  const [shareName, setShareName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  const minEndMinutes = useMemo(() => {
    if (rangeFrom !== rangeTo) return undefined;
    if (rangeFromTime === TIME_NOW) {
      const now = new Date();
      return (
        Math.ceil((now.getHours() * 60 + now.getMinutes()) / TIME_STEP_MIN) *
          TIME_STEP_MIN +
        TIME_STEP_MIN
      );
    }
    return timeToMinutes(rangeFromTime) + TIME_STEP_MIN;
  }, [rangeFrom, rangeTo, rangeFromTime]);

  function handleRangeFromChange(nextDate: string) {
    setRangeFrom(nextDate);
    if (nextDate === localDateValue()) {
      setRangeFromTime(TIME_NOW);
    } else {
      setRangeFromTime("09:00");
    }
  }

  function handleRangeToChange(nextDate: string) {
    setRangeTo(nextDate);
    if (nextDate === rangeFrom && rangeFromTime !== TIME_NOW) {
      const minEnd = timeToMinutes(rangeFromTime) + TIME_STEP_MIN;
      if (timeToMinutes(rangeToTime) < minEnd) {
        setRangeToTime(minutesToTime(minEnd));
      }
    }
  }

  function resetRangeFields() {
    setRangeFrom(localDateValue());
    setRangeTo(weekFromNowDateValue());
    setRangeFromTime(TIME_NOW);
    setRangeToTime("23:45");
  }

  const ruleOptions: {
    id: RulePreset;
    label: string;
    hint?: string;
  }[] = [
    { id: "unlimited", label: t.ruleUnlimited, hint: t.ruleUnlimitedHint },
    { id: "once", label: t.ruleOnce, hint: t.ruleOnceHint },
    { id: "1h", label: t.rule1h },
    { id: "24h", label: t.rule24h },
    { id: "7d", label: t.rule7d },
    { id: "range", label: t.ruleFromTo, hint: t.ruleFromToHint },
  ];

  async function withBiometric(
    action: () => void | Promise<void>,
  ): Promise<void> {
    await action();
  }

  function removeController(id: string) {
    setControllers((prev) => prev.filter((c) => c.id !== id));
    onToast?.(t.toastControllerRemoved);
  }

  async function addController() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (preset === "range" && (!rangeFrom || !rangeTo)) return;

    const rule = buildRule(
      preset,
      rangeFrom,
      rangeFromTime,
      rangeTo,
      rangeToTime,
    );
    const controllerId = crypto.randomUUID();

    setSaving(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateId: selectedGateId,
          name: trimmed,
          rule,
          id: controllerId,
        }),
      });

      if (!res.ok) throw new Error("invite failed");
      const data = (await res.json()) as { url: string };
      const url = data.url;

      setControllers((prev) => [
        ...prev,
        {
          id: controllerId,
          name: trimmed,
          rule,
          grantedAt: Date.now(),
        },
      ]);

      setName("");
      setPreset("unlimited");
      resetRangeFields();
      setShareUrl(url);
      setShareName(trimmed);
      setCopied(false);
      setPanelView("share");
      onToast?.(t.toastControllerAdded);
    } catch {
      onToast?.(t.toastCommandFailed);
    } finally {
      setSaving(false);
    }
  }

  function openEditForUser(user: GateController) {
    const form = ruleToFormState(user.rule);
    setEditingId(user.id);
    setName(user.name);
    setPreset(form.preset);
    setRangeFrom(form.rangeFrom);
    setRangeTo(form.rangeTo);
    setRangeFromTime(form.rangeFromTime);
    setRangeToTime(form.rangeToTime);
    setPanelView("edit");
  }

  function saveAccessChanges() {
    if (!editingId) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (preset === "range" && (!rangeFrom || !rangeTo)) return;

    const rule = buildRule(
      preset,
      rangeFrom,
      rangeFromTime,
      rangeTo,
      rangeToTime,
    );

    setControllers((prev) =>
      prev.map((c) =>
        c.id === editingId ? { ...c, name: trimmed, rule } : c,
      ),
    );
    setEditingId(null);
    setName("");
    setPreset("unlimited");
    resetRangeFields();
    setPanelView("list");
    onToast?.(t.toastAccessUpdated);
  }

  function openPreviewGuest() {
    void withBiometric(() => {
      if (!shareUrl) return;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    });
  }

  function openWhatsAppShare() {
    void withBiometric(() => {
      if (!shareUrl) return;
      const message = buildInviteWhatsAppMessage(locale, shareName, shareUrl);
      window.open(buildWhatsAppShareUrl(message), "_blank", "noopener,noreferrer");
    });
  }

  async function copyInviteLink() {
    await withBiometric(async () => {
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    });
  }

  async function shareQrImage() {
    await withBiometric(async () => {
      const svg = qrWrapRef.current?.querySelector("svg");
      if (!svg || !shareUrl) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const dataUrl =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 512;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("canvas"));
            return;
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
            "image/png",
          );
        };
        img.onerror = () => reject(new Error("image"));
        img.src = dataUrl;
      });

      const file = new File([pngBlob], "gate-invite-qr.png", {
        type: "image/png",
      });

      if (typeof navigator.share === "function") {
        try {
          if (!navigator.canShare?.({ files: [file] })) {
            throw new Error("nos share files");
          }
          await navigator.share({ files: [file], title: shareName });
          return;
        } catch {
          /* fall through to download */
        }
      }

      const objectUrl = URL.createObjectURL(pngBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "gate-invite-qr.png";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      onToast?.(t.shareQrSaved);
    });
  }

  if (panelView === "share") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 pb-3 text-center">
          <h2 className="text-lg font-bold text-gate-ink">{t.shareInviteTitle}</h2>
          <p className="mt-1 text-xs leading-relaxed text-gate-muted">
            {t.shareInviteIntro}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-gate-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gate-muted">
              {shareName}
            </p>
            <div
              ref={qrWrapRef}
              className="rounded-2xl border-4 border-white bg-white p-2 shadow-gate-sm"
            >
              <QRCodeSVG
                value={shareUrl}
                size={160}
                level="M"
                includeMargin={false}
                aria-label={t.inviteQrHint}
              />
            </div>
            <p className="max-w-[260px] text-center text-xs leading-relaxed text-gate-muted">
              {t.inviteQrHint}
            </p>
          </div>

          <div className="rounded-2xl border border-gate-line bg-slate-50/80 p-3">
            <p className="break-all font-mono text-[0.65rem] leading-relaxed text-gate-muted">
              {shareUrl}
            </p>
          </div>
        </div>

        <div className="mt-3 shrink-0 space-y-2">
          <button
            type="button"
            onClick={openPreviewGuest}
            className="w-full rounded-2xl border-2 border-blue-300 bg-blue-50 py-3.5 text-sm font-bold text-blue-800 active:bg-blue-100"
          >
            {t.previewGuestView}
          </button>
          <button
            type="button"
            onClick={openWhatsAppShare}
            className="w-full rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-gate active:bg-[#1fb855]"
          >
            {t.shareViaWhatsApp}
          </button>
          <button
            type="button"
            onClick={shareQrImage}
            className="w-full rounded-2xl border border-gate-line bg-white py-3.5 text-sm font-bold text-gate-ink active:bg-slate-50"
          >
            {t.shareQrImage}
          </button>
          <button
            type="button"
            onClick={copyInviteLink}
            className="w-full rounded-2xl border border-gate-line bg-white py-3.5 text-sm font-bold text-gate-ink active:bg-slate-50"
          >
            {copied ? t.copiedInviteLink : t.copyInviteLink}
          </button>
          <button
            type="button"
            onClick={() => setPanelView("list")}
            className="w-full rounded-2xl py-2.5 text-sm font-semibold text-gate-gold"
          >
            {t.shareDone}
          </button>
        </div>
      </div>
    );
  }

  if (panelView === "history") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-2 pb-3">
          <BackButton onClick={() => setPanelView("list")} />
          <h2 className="text-lg font-bold text-gate-ink">{t.historyTitle}</h2>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gate-line bg-white/80 py-12 text-center">
              <IconActivity className="mb-3 h-8 w-8 text-gate-muted/40" />
              <p className="text-sm text-gate-muted">{t.historyEmpty}</p>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl border border-gate-line bg-gate-surface px-4 py-3 shadow-sm"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide",
                    entry.action === "OPEN"
                      ? "bg-green-50 text-green-800"
                      : "bg-blue-50 text-blue-800",
                  )}
                >
                  {entry.action === "OPEN" ? t.historyOpen : t.historyClose}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gate-ink">
                    {entry.userName}
                  </p>
                  <p className="text-xs text-gate-muted">
                    {formatHistoryWhen(entry.timestamp, locale)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (panelView === "add" || panelView === "edit") {
    const isEdit = panelView === "edit";
    const rangeEnd =
      preset === "range"
        ? combineDateAndTime(rangeTo, rangeToTime)
        : 0;
    const rangeStart =
      preset === "range"
        ? combineDateAndTime(rangeFrom, rangeFromTime)
        : 0;
    const canSave =
      name.trim().length > 0 &&
      (preset !== "range" ||
        (rangeFrom.length > 0 &&
          rangeTo.length > 0 &&
          rangeEnd > rangeStart));

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-2 pb-3">
          <BackButton
            onClick={() => {
              setEditingId(null);
              setPanelView("list");
            }}
          />
          <h2 className="text-lg font-bold text-gate-ink">
            {isEdit ? t.editAccessTitle : t.addController}
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gate-muted">
              {t.controllerName}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.controllerNamePlaceholder}
              className="w-full rounded-2xl border border-gate-line bg-gate-surface px-4 py-3 text-sm text-gate-ink outline-none ring-blue-400 focus:ring-2"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gate-muted">
              {t.accessDurationLabel}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {ruleOptions.map((opt) => {
                const selected = preset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreset(opt.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      selected
                        ? "border-blue-400 bg-blue-50 text-gate-ink"
                        : "border-gate-line bg-white text-gate-ink active:bg-slate-50",
                    )}
                  >
                    <span className="block text-sm font-bold">{opt.label}</span>
                    {opt.hint && (
                      <span className="mt-0.5 block text-[0.65rem] leading-snug text-gate-muted">
                        {opt.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {preset === "range" && (
            <div className="space-y-4 rounded-2xl border border-gate-line bg-slate-50/80 p-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gate-muted">
                    {t.fromDate}
                  </span>
                  <input
                    type="date"
                    value={rangeFrom}
                    min={localDateValue()}
                    onChange={(e) => handleRangeFromChange(e.target.value)}
                    className="w-full rounded-xl border border-gate-line bg-white px-3 py-2.5 text-sm outline-none ring-blue-400 focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gate-muted">
                    {t.toDate}
                  </span>
                  <input
                    type="date"
                    value={rangeTo}
                    min={rangeFrom}
                    onChange={(e) => handleRangeToChange(e.target.value)}
                    className="w-full rounded-xl border border-gate-line bg-white px-3 py-2.5 text-sm outline-none ring-blue-400 focus:ring-2"
                  />
                </label>
              </div>

              <AlarmWheelTimePicker
                label={t.fromTime}
                dateStr={rangeFrom}
                includeNow={rangeFrom === localDateValue()}
                value={rangeFromTime}
                nowLabel={t.timeNow}
                hourLabel={t.hourColumn}
                minuteLabel={t.minuteColumn}
                onChange={(id) => {
                  setRangeFromTime(id);
                  if (rangeFrom === rangeTo && id !== TIME_NOW) {
                    const minEnd = timeToMinutes(id) + TIME_STEP_MIN;
                    if (timeToMinutes(rangeToTime) < minEnd) {
                      setRangeToTime(minutesToTime(minEnd));
                    }
                  }
                }}
              />

              <AlarmWheelTimePicker
                label={t.toTime}
                dateStr={rangeTo}
                value={rangeToTime}
                minMinutes={
                  rangeFrom === rangeTo ? minEndMinutes : undefined
                }
                nowLabel={t.timeNow}
                hourLabel={t.hourColumn}
                minuteLabel={t.minuteColumn}
                onChange={setRangeToTime}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!canSave || saving}
          onClick={isEdit ? saveAccessChanges : addController}
          className="mt-3 shrink-0 rounded-2xl bg-blue-500 py-3.5 text-sm font-bold text-white shadow-gate transition active:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving
            ? t.pleaseWait
            : isEdit
              ? t.saveAccessChanges
              : t.saveController}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-3 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <IconUsers className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-gate-ink">{t.controllersTitle}</h2>
        <p className="mt-1 text-xs leading-relaxed text-gate-muted">
          {t.controllersIntro}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPanelView("add")}
        className="mb-3 shrink-0 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/80 py-3 text-sm font-bold text-blue-700 active:bg-blue-100"
      >
        + {t.addController}
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {controllers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gate-line bg-white/80 py-10 text-center text-sm text-gate-muted">
            {t.noControllers}
          </div>
        ) : (
          controllers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-2xl border border-gate-line bg-gate-surface px-4 py-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gate-ink">
                  {user.name}
                </p>
                <p className="text-xs text-gate-muted">
                  {formatControllerAccess(user.rule, locale)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => openEditForUser(user)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 active:bg-blue-100"
                >
                  {t.changeAccess}
                </button>
                <button
                  type="button"
                  onClick={() => removeController(user.id)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 active:bg-red-100"
                >
                  {t.removeController}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => setPanelView("history")}
        className="mt-3 flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-gate-line bg-white py-3 text-sm font-semibold text-gate-ink shadow-sm active:bg-slate-50"
      >
        <IconActivity className="h-4 w-4 text-gate-gold" />
        {t.viewHistory}
      </button>
    </div>
  );
}
