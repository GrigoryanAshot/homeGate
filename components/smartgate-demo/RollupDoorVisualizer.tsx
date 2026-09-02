import type { GateState } from "@/lib/smartgate/types";
import { cn } from "@/lib/utils";

const ASSETS = {
  motor: "/img/Rollup/rollupBase.png",
  lamil: "/img/Rollup/lamil.png",
  case: "/img/Rollup/caseDetail.png",
} as const;

/** Native pixel sizes from your PNG files */
const NATIVE = {
  width: 805,
  motorH: 132,
  caseW: 25,
  caseH: 702,
  caseInset: 20,
  lamilW: 713,
  lamilH: 33,
} as const;

const TOTAL_H = NATIVE.motorH + NATIVE.caseH;
const TRACK_INNER_W =
  NATIVE.width - NATIVE.caseInset * 2 - NATIVE.caseW * 2;
const LAMIL_LEFT =
  NATIVE.caseInset + NATIVE.caseW + (TRACK_INNER_W - NATIVE.lamilW) / 2;
const LAMIL_COUNT = Math.floor(NATIVE.caseH / NATIVE.lamilH);

/**
 * Target open amount — CSS transition animates between states.
 * opening → 1 and closing → 0 so open/close both ease smoothly.
 */
const openProgress: Record<GateState, number> = {
  closed: 0,
  closing: 0,
  stopped: 0.5,
  opening: 1,
  open: 1,
  unknown: 0,
};

const GATE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GATE_DURATION = "2.4s";

function pct(value: number, base: number) {
  return `${(value / base) * 100}%`;
}

export function RollupDoorVisualizer({
  state,
  className,
}: {
  state: GateState;
  moving?: boolean;
  className?: string;
}) {
  const progress = openProgress[state];

  const lamilLiftPct =
    LAMIL_COUNT > 1 ? progress * ((LAMIL_COUNT - 1) / LAMIL_COUNT) * 100 : 0;

  const trackLeft = pct(NATIVE.caseInset + NATIVE.caseW, NATIVE.width);
  const trackRight = pct(NATIVE.caseInset + NATIVE.caseW, NATIVE.width);

  return (
    <div
      className={cn(
        "relative mx-auto h-full max-h-[min(28dvh,220px)] w-full max-w-[min(78vw,280px)]",
        className,
      )}
      style={{ aspectRatio: `${NATIVE.width} / ${TOTAL_H}` }}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#c8cfd8] shadow-gate-sm">
        {/* Bright driveway / daylight behind the opening */}
        <div
          className="absolute"
          style={{
            top: pct(NATIVE.motorH, TOTAL_H),
            left: trackLeft,
            right: trackRight,
            height: pct(NATIVE.caseH, TOTAL_H),
            background:
              "linear-gradient(180deg, #9ec5eb 0%, #dce8f4 38%, #e8ecf0 72%, #b8c0c8 100%)",
          }}
        />

        {/* Lamels — clipped to track, behind side cases */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: pct(NATIVE.motorH, TOTAL_H),
            left: pct(LAMIL_LEFT, NATIVE.width),
            width: pct(NATIVE.lamilW, NATIVE.width),
            height: pct(NATIVE.caseH, TOTAL_H),
          }}
        >
          <div
            className="flex flex-col"
            style={{
              transform: `translateY(-${lamilLiftPct}%)`,
              transition: `transform ${GATE_DURATION} ${GATE_EASE}`,
            }}
          >
            {Array.from({ length: LAMIL_COUNT }).map((_, i) => (
              <img
                key={i}
                src={ASSETS.lamil}
                alt=""
                draggable={false}
                className="block w-full shrink-0 select-none"
                style={{ height: pct(NATIVE.lamilH, NATIVE.caseH) }}
              />
            ))}
          </div>
        </div>

        {/* Left track — 10px inset from motor edge */}
        <img
          src={ASSETS.case}
          alt=""
          draggable={false}
          className="absolute z-[2] select-none object-fill"
          style={{
            top: pct(NATIVE.motorH, TOTAL_H),
            left: pct(NATIVE.caseInset, NATIVE.width),
            width: pct(NATIVE.caseW, NATIVE.width),
            height: pct(NATIVE.caseH, TOTAL_H),
          }}
        />

        {/* Right track — 10px inset from motor edge */}
        <img
          src={ASSETS.case}
          alt=""
          draggable={false}
          className="absolute z-[2] select-none object-fill"
          style={{
            top: pct(NATIVE.motorH, TOTAL_H),
            right: pct(NATIVE.caseInset, NATIVE.width),
            width: pct(NATIVE.caseW, NATIVE.width),
            height: pct(NATIVE.caseH, TOTAL_H),
          }}
        />

        {/* Motor / header box — on top */}
        <img
          src={ASSETS.motor}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 z-[3] w-full select-none"
          style={{ height: pct(NATIVE.motorH, TOTAL_H) }}
        />
      </div>
    </div>
  );
}
