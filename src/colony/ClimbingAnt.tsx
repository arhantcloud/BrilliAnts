import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import AntSvg from "../mascot/AntSvg";

const ANT_PX = 42;
const SVG_NS = "http://www.w3.org/2000/svg";

/** Smallest signed difference (deg) from a toward b. */
function shortDelta(a: number, b: number): number {
  let dd = (b - a) % 360;
  if (dd > 180) dd -= 360;
  if (dd < -180) dd += 360;
  return dd;
}

/**
 * A rescued ant crawling out of the colony along the carved tunnels. It samples
 * the tunnel bezier (`d`, field coordinates) with getPointAtLength on a rAF
 * loop and drives x/y/rotate motion values, the same structure the roaming
 * ants use, so the CSS leg gait animates while it follows the curves. Fades out
 * at the surface, then calls `onDone`.
 */
export default function ClimbingAnt({
  d,
  duration,
  onDone,
}: {
  /** SVG path (field-space) from the ant's chamber up and out the entrance. */
  d: string;
  duration: number;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const half = ANT_PX / 2;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(1);

  useEffect(() => {
    if (reduce || !d) {
      onDone();
      return;
    }

    const pathEl = document.createElementNS(SVG_NS, "path");
    pathEl.setAttribute("d", d);
    const len = pathEl.getTotalLength();
    if (!len || !Number.isFinite(len)) {
      onDone();
      return;
    }

    const headingAt = (dist: number) => {
      const a = pathEl.getPointAtLength(Math.max(0, dist - 2));
      const b = pathEl.getPointAtLength(Math.min(len, dist + 2));
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
    };

    // Seed position + facing at the start of the path.
    const p0 = pathEl.getPointAtLength(0);
    x.set(p0.x - half);
    y.set(p0.y - half);
    rotate.set(headingAt(0));

    const durMs = Math.max(1, duration) * 1000;
    let raf = 0;
    let startT = 0;

    const step = (t: number) => {
      if (!startT) startT = t;
      const prog = Math.min(1, (t - startT) / durMs);
      const dist = prog * len;
      const pt = pathEl.getPointAtLength(dist);
      x.set(pt.x - half);
      y.set(pt.y - half);
      // Ease the heading toward the path tangent (no long-way spins).
      const target = headingAt(dist);
      rotate.set(rotate.get() + shortDelta(rotate.get(), target) * 0.35);
      // Fade out over the final stretch (surface exit).
      opacity.set(prog > 0.86 ? Math.max(0, 1 - (prog - 0.86) / 0.14) : 1);

      if (prog < 1) {
        raf = requestAnimationFrame(step);
      } else {
        onDone();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce, d, duration, half, x, y, rotate, opacity, onDone]);

  if (reduce || !d) return null;

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ width: ANT_PX, height: ANT_PX, x, y, opacity }}
    >
      {/* Rotation on an inner layer so the leg gait (CSS on the SVG) animates. */}
      <motion.div className="h-full w-full" style={{ rotate }}>
        <AntSvg walking className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" />
      </motion.div>
      <span className="absolute -right-1 -top-2 text-[10px]" aria-hidden>
        ✨
      </span>
    </motion.div>
  );
}
