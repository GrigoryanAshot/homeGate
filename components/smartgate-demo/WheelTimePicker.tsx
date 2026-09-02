"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export const TIME_NOW = "now";
const ITEM_H = 44;
const PAD_ROWS = 2;
const MINUTES = [0, 15, 30, 45] as const;

export type WheelColumnOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max));
}

function localDateValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeValue(value: string) {
  if (value === TIME_NOW) return { isNow: true as const, hour: 0, minute: 0 };
  const [h, m] = value.split(":").map(Number);
  return { isNow: false as const, hour: h, minute: m };
}

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minuteLabel(m: number) {
  return String(m).padStart(2, "0");
}

function WheelColumn({
  label,
  options,
  value,
  onChange,
  muted,
}: {
  label: string;
  options: WheelColumnOption[];
  value: string;
  onChange: (id: string) => void;
  muted?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const isProgrammaticScroll = useRef(false);
  const optionIds = options.map((o) => o.id).join("|");

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const safeIndex =
    selectedIndex >= 0 ? selectedIndex : clampIndex(0, options.length - 1);

  const snapToIndex = useCallback(
    (index: number, smooth = true) => {
      const el = listRef.current;
      if (!el || options.length === 0) return;
      const clamped = clampIndex(index, options.length - 1);
      const next = options[clamped];
      if (!next || next.disabled) return;

      isProgrammaticScroll.current = true;
      el.scrollTo({
        top: clamped * ITEM_H,
        behavior: smooth ? "smooth" : "auto",
      });
      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, smooth ? 220 : 0);

      if (next.id !== value) onChange(next.id);
    },
    [onChange, options, value],
  );

  useEffect(() => {
    const el = listRef.current;
    if (!el || options.length === 0) return;
    isProgrammaticScroll.current = true;
    el.scrollTop = safeIndex * ITEM_H;
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 0);
  }, [safeIndex, options.length, optionIds]);

  function handleScroll() {
    if (isProgrammaticScroll.current) return;
    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = window.setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const index = clampIndex(
        Math.round(el.scrollTop / ITEM_H),
        options.length - 1,
      );
      snapToIndex(index);
    }, 90);
  }

  if (options.length === 0) return null;

  return (
    <div className={cn("min-w-0 flex-1", muted && "opacity-45")}>
      <span className="mb-1 block text-center text-[0.65rem] font-semibold uppercase tracking-wide text-gate-muted">
        {label}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        onScroll={handleScroll}
        className="h-[220px] snap-y snap-mandatory overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: PAD_ROWS }).map((_, i) => (
          <div
            key={`t-${i}`}
            className="shrink-0"
            style={{ height: ITEM_H }}
            aria-hidden
          />
        ))}

        {options.map((option, index) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={option.disabled}
              onClick={() => snapToIndex(index)}
              className={cn(
                "flex w-full shrink-0 snap-center items-center justify-center px-2 text-center transition-[transform,opacity,color]",
                option.disabled && "pointer-events-none opacity-30",
                selected
                  ? "scale-100 text-lg font-bold text-gate-ink"
                  : "scale-95 text-sm font-medium text-gate-muted/80",
              )}
              style={{ height: ITEM_H }}
            >
              {option.label}
            </button>
          );
        })}

        {Array.from({ length: PAD_ROWS }).map((_, i) => (
          <div
            key={`b-${i}`}
            className="shrink-0"
            style={{ height: ITEM_H }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export function AlarmWheelTimePicker({
  label,
  value,
  onChange,
  dateStr,
  includeNow = false,
  minMinutes,
  nowLabel,
  hourLabel,
  minuteLabel: minuteColLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dateStr: string;
  includeNow?: boolean;
  minMinutes?: number;
  nowLabel: string;
  hourLabel: string;
  minuteLabel: string;
}) {
  const parsed = parseTimeValue(value);
  const isToday = dateStr === localDateValue();
  const nowRef = useRef(new Date());
  const now = nowRef.current;

  const hourOptions = useMemo(() => {
    const opts: WheelColumnOption[] = [];
    if (includeNow && isToday) {
      opts.push({ id: TIME_NOW, label: nowLabel });
    }

    let startHour = 0;
    if (isToday) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const minM = minMinutes ?? nowMins;
      startHour = Math.floor(minM / 60);
    }

    for (let h = isToday ? startHour : 0; h < 24; h += 1) {
      opts.push({
        id: String(h),
        label: String(h).padStart(2, "0"),
      });
    }
    return opts;
  }, [includeNow, isToday, minMinutes, nowLabel, now]);

  const activeHourId = parsed.isNow ? TIME_NOW : String(parsed.hour);

  const minuteOptions = useMemo(() => {
    if (parsed.isNow) {
      return [{ id: "dash", label: "—", disabled: true }];
    }

    const opts: WheelColumnOption[] = [];
    let minM = 0;

    if (isToday && parsed.hour === now.getHours()) {
      minM = Math.ceil((now.getMinutes() + 1) / 15) * 15;
    }
    if (minMinutes !== undefined && parsed.hour === Math.floor(minMinutes / 60)) {
      minM = Math.max(minM, minMinutes % 60);
    }

    for (const m of MINUTES) {
      if (m < minM) continue;
      opts.push({
        id: String(m),
        label: minuteLabel(m),
      });
    }

    if (opts.length === 0) {
      opts.push({ id: "0", label: minuteLabel(0) });
    }
    return opts;
  }, [parsed.isNow, parsed.hour, isToday, minMinutes, now]);

  const activeMinuteId = parsed.isNow
    ? "dash"
    : minuteOptions.some((o) => o.id === String(parsed.minute))
      ? String(parsed.minute)
      : (minuteOptions[0]?.id ?? "0");

  function handleHourChange(hourId: string) {
    if (hourId === TIME_NOW) {
      onChange(TIME_NOW);
      return;
    }
    const h = Number(hourId);
    let m = parsed.isNow ? 0 : parsed.minute;

    if (isToday && h === now.getHours()) {
      const minM = Math.ceil((now.getMinutes() + 1) / 15) * 15;
      if (m < minM) m = minM;
    }
    if (minMinutes !== undefined && h === Math.floor(minMinutes / 60)) {
      const floor = minMinutes % 60;
      if (m < floor) m = floor;
    }
    m = MINUTES.find((x) => x >= m) ?? 45;
    onChange(formatTime(h, m));
  }

  function handleMinuteChange(minuteId: string) {
    if (parsed.isNow || minuteId === "dash") return;
    onChange(formatTime(parsed.hour, Number(minuteId)));
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-gate-muted">
        {label}
      </span>
      <div className="relative overflow-hidden rounded-2xl border border-gate-line bg-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-12 bg-gradient-to-b from-white via-white/85 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-12 bg-gradient-to-t from-white via-white/85 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-4 top-[calc(50%+10px)] z-[1] h-11 -translate-y-1/2 rounded-xl border border-blue-200/80 bg-blue-50/40"
          aria-hidden
        />

        <div className="relative z-[2] flex gap-1 px-2 pb-1 pt-2">
          <WheelColumn
            label={hourLabel}
            options={hourOptions}
            value={
              hourOptions.some((o) => o.id === activeHourId)
                ? activeHourId
                : (hourOptions[0]?.id ?? "0")
            }
            onChange={handleHourChange}
          />
          <div
            className="mt-6 w-px shrink-0 self-stretch bg-gate-line/80"
            aria-hidden
          />
          <WheelColumn
            label={minuteColLabel}
            options={minuteOptions}
            value={activeMinuteId}
            onChange={handleMinuteChange}
            muted={parsed.isNow}
          />
        </div>
      </div>
    </div>
  );
}
