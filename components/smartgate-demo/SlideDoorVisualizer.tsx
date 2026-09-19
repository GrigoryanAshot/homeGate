"use client";

import { useEffect } from "react";
import type { GateState } from "@/lib/smartgate/types";
import { cn } from "@/lib/utils";

/**
 * Sliding gate — assets:
 *   public/img/Slide/frame.png  (1337×648) — posts
 *   public/img/Slide/door.png   (1235×645) — moving leaf
 */
const ASSETS = {
  frame: "/img/Slide/frame.png",
  door: "/img/Slide/door.png",
} as const;

const NATIVE = {
  width: 1337,
  height: 648,
  doorW: 1235,
  doorH: 645,
  doorLeft: Math.round((1337 - 1235) / 2),
  doorTop: Math.round((648 - 645) / 2),
} as const;

/**
 * opening/open share the same target so CSS runs one continuous ease
 * (no mid-travel jump from 0.85 → 1).
 */
const openProgress: Record<GateState, number> = {
  closed: 0,
  closing: 0,
  stopped: 0.45,
  opening: 1,
  open: 1,
  unknown: 0,
};

const GATE_EASE = "cubic-bezier(0.45, 0.05, 0.55, 0.95)";
const GATE_DURATION = "10s";

function pct(value: number, base: number) {
  return `${(value / base) * 100}%`;
}

export function SlideDoorVisualizer({
  state,
  className,
}: {
  state: GateState;
  className?: string;
}) {
  const progress = openProgress[state];
  // Fraction of door width to slide left when fully open
  const slide = progress * 0.9;

  useEffect(() => {
    const a = new Image();
    const b = new Image();
    a.src = ASSETS.door;
    b.src = ASSETS.frame;
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto h-full max-h-[min(28dvh,220px)] w-full max-w-[min(78vw,280px)] overflow-hidden",
        className,
      )}
      style={{ aspectRatio: `${NATIVE.width} / ${NATIVE.height}` }}
    >
      <div className="absolute inset-0 overflow-hidden bg-black shadow-gate-sm">
        <div
          className="absolute"
          style={{
            left: pct(NATIVE.doorLeft, NATIVE.width),
            top: pct(NATIVE.doorTop + 20, NATIVE.height),
            width: pct(NATIVE.doorW, NATIVE.width),
            height: pct(NATIVE.doorH - 40, NATIVE.height),
            background:
              "linear-gradient(180deg, #7eb0e0 0%, #c5daf0 45%, #e2e8f0 100%)",
          }}
        />

        {/* Clip track — only the leaf moves (own compositor layer) */}
        <div
          className="absolute z-[1] overflow-hidden"
          style={{
            left: pct(NATIVE.doorLeft, NATIVE.width),
            top: pct(NATIVE.doorTop, NATIVE.height),
            width: pct(NATIVE.doorW, NATIVE.width),
            height: pct(NATIVE.doorH, NATIVE.height),
          }}
        >
          <img
            src={ASSETS.door}
            alt=""
            draggable={false}
            decoding="async"
            className="pointer-events-none absolute left-0 top-0 h-full w-full select-none object-fill"
            style={{
              transform: `translate3d(${(-slide * 100).toFixed(3)}%, 0, 0)`,
              transition: `transform ${GATE_DURATION} ${GATE_EASE}`,
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          />
        </div>

        <img
          src={ASSETS.frame}
          alt=""
          draggable={false}
          decoding="async"
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full select-none object-fill"
        />
      </div>
    </div>
  );
}
