import { useEffect, useState } from "react";
import type { ArmyAnt } from "../types";
import {
  MAX_RANK,
  attemptsLeft,
  dayHasPassed,
  eligibleAtMs,
  ringProgress,
} from "./antState";
import { RankBadge, RANK_VISUALS } from "./rankVisuals";

/** Format milliseconds remaining into a compact "Xh Ym" / "Xm" / "Xs" label. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "now";
  if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * The hover graphic for an ant: a circular ring showing how much of the one-day
 * wait has elapsed toward the next possible upgrade, with the rank badge at its
 * centre. When the wait is over the ring is full and glows ("Ready to upgrade");
 * a max-rank general shows a gold star instead.
 */
export default function CountdownRing({
  ant,
  size = 56,
}: {
  ant: ArmyAnt;
  size?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  const maxed = ant.rank >= MAX_RANK;
  const passed = dayHasPassed(ant);
  // Tick once a second while still counting down (no need once ready/maxed).
  useEffect(() => {
    if (maxed || passed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [maxed, passed]);

  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const frac = maxed ? 1 : ringProgress(ant, now);
  const ready = passed && !maxed;
  const attemptsToday = attemptsLeft(ant);
  const ink = RANK_VISUALS[ant.rank].badgeFill;

  if (maxed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="army-shimmer flex items-center justify-center rounded-full bg-stone-900/85 p-2"
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
            <path
              d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 22l-5.2 2.8 1-5.8L3.5 9.2l5.9-.9z"
              fill="#f5c542"
            />
          </svg>
        </div>
        <span className="rounded-full bg-stone-900/90 px-2 py-0.5 text-[10px] font-bold text-amber-200">
          Max rank
        </span>
      </div>
    );
  }

  const label = ready
    ? attemptsToday > 0
      ? "Ready to upgrade"
      : "No attempts left today"
    : `Upgrade in ${formatRemaining(Math.max(0, eligibleAtMs(ant) - now))}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative ${ready && attemptsToday > 0 ? "army-ready" : ""}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="-rotate-90"
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="5" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={ink}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - frac)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <RankBadge rank={ant.rank} size={size * 0.42} />
        </span>
      </div>
      <span className="whitespace-nowrap rounded-full bg-stone-900/90 px-2 py-0.5 text-[10px] font-bold text-amber-100">
        {label}
      </span>
    </div>
  );
}
