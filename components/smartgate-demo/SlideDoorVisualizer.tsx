import type { GateState } from "@/lib/smartgate/types";
import { cn } from "@/lib/utils";

/**
 * Sliding gate — drop your assets here:
 *   public/img/Slide/frame.png  — fixed framing / posts
 *   public/img/Slide/door.png   — moving leaf
 *
 * Door slides horizontally (open = move left). Adjust NATIVE if your
 * PNGs have different pixel sizes.
 */
const ASSETS = {
  frame: "/img/Slide/frame.png",
  door: "/img/Slide/door.png",
} as const;

/** Placeholder aspect until real art is measured — tweak to match PNGs */
const NATIVE = {
  width: 800,
  height: 520,
  /** Door leaf size relative to frame */
  doorW: 520,
  doorH: 460,
  /** Where the closed door sits inside the frame */
  doorLeft: 140,
  doorTop: 30,
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
  // Slide left to open (door moves aside)
  const slidePct = progress * 88;

  return (
    <div
      className={cn(
        "relative mx-auto h-full max-h-[min(28dvh,220px)] w-full max-w-[min(78vw,280px)] overflow-hidden",
        className,
      )}
      style={{ aspectRatio: `${NATIVE.width} / ${NATIVE.height}` }}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#c8cfd8] shadow-gate-sm">
        {/* Daylight behind opening */}
        <div
          className="absolute inset-[8%] rounded-sm"
          style={{
            background:
              "linear-gradient(180deg, #9ec5eb 0%, #dce8f4 40%, #e8ecf0 100%)",
          }}
        />

        {/* Moving door leaf */}
        <img
          src={ASSETS.door}
          alt=""
          draggable={false}
          className="absolute z-[1] select-none object-contain"
          style={{
            left: pct(NATIVE.doorLeft, NATIVE.width),
            top: pct(NATIVE.doorTop, NATIVE.height),
            width: pct(NATIVE.doorW, NATIVE.width),
            height: pct(NATIVE.doorH, NATIVE.height),
            transform: `translate3d(-${slidePct}%, 0, 0)`,
            transition: `transform ${GATE_DURATION} ${GATE_EASE}`,
          }}
          onError={(e) => {
            const el = e.currentTarget;
            el.style.background = "#64748b";
            el.style.objectFit = "none";
          }}
        />

        {/* Fixed frame on top */}
        <img
          src={ASSETS.frame}
          alt=""
          draggable={false}
          className="absolute inset-0 z-[2] h-full w-full select-none object-contain"
          onError={(e) => {
            e.currentTarget.style.opacity = "0.35";
          }}
        />
      </div>
    </div>
  );
}
