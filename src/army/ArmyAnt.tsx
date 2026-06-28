import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import AntSvg from "../mascot/AntSvg";
import type { ArmyAnt as ArmyAntData } from "../types";
import { RANK_VISUALS, RankBadge, rankLabel } from "./rankVisuals";
import CountdownRing from "./CountdownRing";

const ANT_PX = 44;
const SPEED = 16; // slow ambient wander
const TURN_RATE = 2.4;
const EDGE_PAD = ANT_PX / 2 + 2;

function ellipseNorm(dx: number, dy: number, rx: number, ry: number): number {
  return Math.hypot(dx / Math.max(1, rx), dy / Math.max(1, ry));
}

function shortDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * A ranked army ant that wanders inside its anthill's plot and acts as a button.
 * Re-skins {@link AntSvg} with the rank's colours, pins an always-visible rank
 * badge, glows when an upgrade is ready, and reveals the {@link CountdownRing}
 * on hover. Movement mirrors the colony's RoamingAnt (rAF wander on motion
 * values, reduced-motion aware) so it never re-renders per frame.
 */
export default function ArmyAnt({
  field,
  ant,
  active = true,
  eligible,
  onClick,
}: {
  field: { w: number; h: number };
  ant: ArmyAntData;
  /** Whether the scene is on screen; pauses the wander loop when false. */
  active?: boolean;
  /** True when this ant can be upgraded right now (drives glow + click). */
  eligible: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  const visual = RANK_VISUALS[ant.rank];

  const [start] = useState(() => {
    const rx = Math.max(0, field.w / 2 - EDGE_PAD);
    const ry = Math.max(0, field.h / 2 - EDGE_PAD);
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    return {
      x: field.w / 2 + Math.cos(t) * rx * r,
      y: field.h / 2 + Math.sin(t) * ry * r,
      dir: Math.random() * Math.PI * 2,
      speed: SPEED * (0.7 + Math.random() * 0.6),
      nextPause: 1.5 + Math.random() * 3,
    };
  });

  const x = useMotionValue(start.x - ANT_PX / 2);
  const y = useMotionValue(start.y - ANT_PX / 2);
  const rotate = useMotionValue((start.dir * 180) / Math.PI + 90);
  const [walking, setWalking] = useState(!reduce);

  const sim = useRef({
    cx: start.x,
    cy: start.y,
    dir: start.dir,
    speed: start.speed,
    pause: 0,
    nextPause: start.nextPause,
  });

  useEffect(() => {
    if (reduce || !active) return;
    let raf = 0;
    let last = performance.now();
    const w = field.w;
    const h = field.h;
    const rx = Math.max(1, w / 2 - EDGE_PAD);
    const ry = Math.max(1, h / 2 - EDGE_PAD);

    const step = (nowT: number) => {
      const dt = Math.min(0.05, (nowT - last) / 1000);
      last = nowT;
      const s = sim.current;

      if (s.pause > 0) {
        s.pause -= dt;
        if (s.pause <= 0) setWalking(true);
      } else {
        s.dir += (Math.random() - 0.5) * TURN_RATE * dt;
        let nx = s.cx + Math.cos(s.dir) * s.speed * dt;
        let ny = s.cy + Math.sin(s.dir) * s.speed * dt;

        if (ellipseNorm(nx - w / 2, ny - h / 2, rx, ry) > 1) {
          const toCenter = Math.atan2(h / 2 - s.cy, w / 2 - s.cx);
          s.dir = toCenter + (Math.random() - 0.5) * 0.9;
          nx = s.cx + Math.cos(s.dir) * s.speed * dt;
          ny = s.cy + Math.sin(s.dir) * s.speed * dt;
          const n = ellipseNorm(nx - w / 2, ny - h / 2, rx, ry);
          if (n > 1) {
            nx = w / 2 + (nx - w / 2) / n;
            ny = h / 2 + (ny - h / 2) / n;
          }
        }

        s.cx = nx;
        s.cy = ny;
        x.set(nx - ANT_PX / 2);
        y.set(ny - ANT_PX / 2);

        const targetDeg = (s.dir * 180) / Math.PI + 90;
        rotate.set(
          rotate.get() + shortDelta(rotate.get(), targetDeg) * Math.min(1, 7 * dt),
        );

        s.nextPause -= dt;
        if (s.nextPause <= 0) {
          s.pause = 0.5 + Math.random() * 1.6;
          s.nextPause = 2.5 + Math.random() * 4;
          s.speed = SPEED * (0.7 + Math.random() * 0.6);
          setWalking(false);
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce, active, field.w, field.h, x, y, rotate]);

  const label = eligible
    ? `${rankLabel(ant.rank)} ant - ready to upgrade`
    : `${rankLabel(ant.rank)} ant`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group/ant pointer-events-auto absolute left-0 top-0 z-0 cursor-pointer hover:z-30 focus:z-30 focus:outline-none"
      style={{ width: ANT_PX, height: ANT_PX, x, y }}
    >
      <motion.div
        className={`h-full w-full transition-transform group-hover/ant:scale-110 ${eligible ? "army-ready" : ""}`}
        style={{ rotate }}
      >
        <AntSvg
          walking={walking}
          bodyColor={visual.body}
          bodyDarkColor={visual.bodyDark}
          className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
        />
      </motion.div>

      {/* Always-on rank badge (upright, outside the rotating layer). */}
      <span className="pointer-events-none absolute -right-0.5 -top-0.5">
        <RankBadge rank={ant.rank} size={16} />
      </span>

      {/* Hover graphic: this ant's own countdown ring + state label. Mounted
          only while the scene is on screen (you can't hover it otherwise), so
          its per-second timer doesn't run in the background. */}
      {active && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/ant:opacity-100">
          <CountdownRing ant={ant} />
        </span>
      )}
    </motion.button>
  );
}
