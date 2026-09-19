import type { GateState } from "@/lib/smartgate/types";
import { cn } from "@/lib/utils";

/**
 * Sliding gate — assets:
 *   public/img/Slide/frame.png  (1337×648) — posts
 *   public/img/Slide/door.png   (1235×645) — moving leaf
 * PNGs use a black matte; stage is black so mats disappear.
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
  /** Center door between posts */
  doorLeft: Math.round((1337 - 1235) / 2),
  doorTop: Math.round((648 - 645) / 2),
} as const;

const openProgress: Record<GateState, number> = {
  closed: 0,
  closing: 0,
  stopped: 0.5,
  opening: 0.85,
  open: 1,
  unknown: 0,
};

const GATE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const GATE_DURATION = "2.4s";

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
  // Slide left to open (handle is on the right of the leaf)
  const slidePct = progress * 92;

  return (
    <div
      className={cn(
        "relative mx-auto h-full max-h-[min(28dvh,220px)] w-full max-w-[min(78vw,280px)] overflow-hidden",
        className,
      )}
      style={{ aspectRatio: `${NATIVE.width} / ${NATIVE.height}` }}
    >
      <div className="absolute inset-0 overflow-hidden bg-black shadow-gate-sm">
        {/* Daylight in the opening — revealed as the door slides away */}
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

        {/* Moving door leaf */}
        <img
          src={ASSETS.door}
          alt=""
          draggable={false}
          className="absolute z-[1] select-none object-fill"
          style={{
            left: pct(NATIVE.doorLeft, NATIVE.width),
            top: pct(NATIVE.doorTop, NATIVE.height),
            width: pct(NATIVE.doorW, NATIVE.width),
            height: pct(NATIVE.doorH, NATIVE.height),
            transform: `translate3d(-${slidePct}%, 0, 0)`,
            transition: `transform ${GATE_DURATION} ${GATE_EASE}`,
          }}
        />

        {/* Fixed posts / frame on top */}
        <img
          src={ASSETS.frame}
          alt=""
          draggable={false}
          className="absolute inset-0 z-[2] h-full w-full select-none object-fill"
        />
      </div>
    </div>
  );
}
