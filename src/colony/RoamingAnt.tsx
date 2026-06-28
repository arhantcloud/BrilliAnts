import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import AntSvg from "../mascot/AntSvg";

const ANT_PX = 45; // rendered ant footprint
const SPEED = 20; // px/s base wander speed (slow, ambient)
const TURN_RATE = 2.6; // rad/s of random heading drift
const EDGE_PAD = ANT_PX / 2 + 2;

/**
 * Normalised distance of a point from an ellipse's centre, where <=1 is inside
 * (1 lands exactly on the boundary). Semi-axes are `rx`/`ry`.
 */
function ellipseNorm(dx: number, dy: number, rx: number, ry: number): number {
  return Math.hypot(dx / Math.max(1, rx), dy / Math.max(1, ry));
}

/** Smallest signed difference (deg) to rotate from `a` toward `b`. */
function shortDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * A single ant that ambiently performs a natural random walk within its
 * chamber's bounds and acts as a button. Reuses the mascot's {@link AntSvg}.
 * Movement is a per-frame wander (heading drifts, steers off walls, pauses now
 * and then) driven by a requestAnimationFrame loop on motion values so it never
 * re-renders. Hovering reveals the question type.
 */
export default function RoamingAnt({
  field,
  label,
  problemType,
  onClick,
}: {
  /** Bounds (in px) of the chamber the ant may roam within. */
  field: { w: number; h: number };
  label: string;
  problemType: string;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();

  // All randomness lives in this lazy initializer (allowed; runs once). The
  // spawn point is sampled uniformly within the chamber's inset ellipse so ants
  // never start poking out of the oval.
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

  // Mutable simulation state (kept out of render).
  const sim = useRef({
    cx: start.x,
    cy: start.y,
    dir: start.dir,
    speed: start.speed,
    pause: 0,
    nextPause: start.nextPause,
  });

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const w = field.w;
    const h = field.h;
    // Roaming is confined to this inset ellipse (matches the chamber oval).
    const rx = Math.max(1, w / 2 - EDGE_PAD);
    const ry = Math.max(1, h / 2 - EDGE_PAD);

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;

      if (s.pause > 0) {
        s.pause -= dt;
        if (s.pause <= 0) setWalking(true);
      } else {
        // Wander: drift the heading a little each frame.
        s.dir += (Math.random() - 0.5) * TURN_RATE * dt;

        let nx = s.cx + Math.cos(s.dir) * s.speed * dt;
        let ny = s.cy + Math.sin(s.dir) * s.speed * dt;

        // Steer back toward the centre when bumping the oval wall.
        if (ellipseNorm(nx - w / 2, ny - h / 2, rx, ry) > 1) {
          const toCenter = Math.atan2(h / 2 - s.cy, w / 2 - s.cx);
          s.dir = toCenter + (Math.random() - 0.5) * 0.9;
          nx = s.cx + Math.cos(s.dir) * s.speed * dt;
          ny = s.cy + Math.sin(s.dir) * s.speed * dt;
          // Pull any overshoot back onto the ellipse boundary.
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

        // Ease the rendered heading toward the travel direction.
        const targetDeg = (s.dir * 180) / Math.PI + 90;
        rotate.set(rotate.get() + shortDelta(rotate.get(), targetDeg) * Math.min(1, 7 * dt));

        // Occasionally stop to forage.
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
  }, [reduce, field.w, field.h, x, y, rotate]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group pointer-events-auto absolute left-0 top-0 z-0 cursor-pointer hover:z-30 focus:z-30 focus:outline-none"
      style={{ width: ANT_PX, height: ANT_PX, x, y }}
    >
      {/* Rotation lives on an inner layer so the tooltip stays upright. */}
      <motion.div
        className="h-full w-full transition-transform group-hover:scale-125"
        style={{ rotate }}
      >
        <AntSvg walking={walking} className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" />
      </motion.div>

      {/* Hover tooltip: problem type. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900/95 px-2.5 py-1 text-xs font-semibold text-amber-50 opacity-0 shadow-lg ring-1 ring-amber-400/40 transition-opacity duration-150 group-hover:opacity-100"
      >
        {problemType}
      </span>
    </motion.button>
  );
}
