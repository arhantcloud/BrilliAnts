import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import AntSvg from "./AntSvg";
import { useMascot } from "./mascot-context";

type Rect = { top: number; left: number; width: number; height: number };
type Footprint = { id: number; x: number; y: number; rot: number };

function toRect(r: DOMRect): Rect {
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const vw = () => (typeof window === "undefined" ? 1024 : window.innerWidth);
const vh = () => (typeof window === "undefined" ? 768 : window.innerHeight);

/** The ant's resting spot for a box: just outside its left (or right) edge,
 * vertically centered, clamped to the viewport. Shared by render + entrance. */
function antTargetFor(rect: Rect): { cx: number; cy: number } {
  const onLeft = rect.left >= 120;
  const cx = Math.round(
    Math.min(
      Math.max(onLeft ? rect.left - 30 : rect.left + rect.width + 30, 26),
      vw() - 26,
    ),
  );
  const cy = Math.round(
    Math.min(Math.max(rect.top + rect.height / 2, 26), vh() - 26),
  );
  return { cx, cy };
}

/**
 * Native smooth scroll has a fixed (fast) duration. We roll our own so the page
 * eases the box into view ~3x more gently before the ant marches over.
 */
const SCROLL_MS = 1200;
/** After a user scroll interrupts the walk, wait this long (ms) before resuming. */
const RESUME_DELAY_MS = 1000;
/** How far past the viewport edge the ant spawns so it starts fully off screen. */
const SPAWN_MARGIN = 120;

function scrollableAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (/(auto|scroll)/.test(oy) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Smoothly center `el` in its scroll container over `duration` ms. Calls
 * `onDone` once the scroll settles (or immediately if no scroll is needed).
 * Returns a cancel fn; cancelling does NOT fire `onDone`.
 */
function smoothCenter(
  el: HTMLElement,
  duration: number,
  onDone: () => void,
): () => void {
  const scroller = scrollableAncestor(el);
  if (!scroller) {
    onDone();
    return () => {};
  }
  const elRect = el.getBoundingClientRect();
  const scRect = scroller.getBoundingClientRect();
  const start = scroller.scrollTop;
  const offset =
    elRect.top - scRect.top - (scroller.clientHeight - el.clientHeight) / 2;
  const max = scroller.scrollHeight - scroller.clientHeight;
  const target = Math.max(0, Math.min(max, start + offset));
  const delta = target - start;
  if (Math.abs(delta) < 1) {
    onDone();
    return () => {};
  }

  let raf = 0;
  const t0 = performance.now();
  const ease = (p: number) => 0.5 - Math.cos(Math.PI * p) / 2; // easeInOut
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    scroller.scrollTop = start + delta * ease(p);
    if (p < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      onDone();
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Distance the ant must crawl between dropping each footprint (one stride). */
const STEP_PX = 24;
/** Top crawl speed in px/s (kept moderate so the ant ambles between boxes). */
const MAX_SPEED = 135;
/** Start easing off the throttle within this distance of the target. */
const ARRIVE_R = 90;
/** Snap-to-stop once this close, switches walk → idle quickly. */
const STOP_R = 14;

/** Quips shown in a little bubble over the ant as it marches on screen. */
const RESCUE_QUIPS = [
  "Brilli to the rescue!",
  "Never fear, Brilli is here!",
  "Let me help you find the Antswer!",
  "Hold on, marching over!",
  "Brilli's on the case!",
];
/** Quips shown as the ant heads off screen. */
const FAREWELL_QUIPS = [
  "You've got this, keep at it!",
  "Off I go, nice work!",
  "Antil next time!",
  "See you soon!",
  "Brilli, marching out!",
];
const pickQuip = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)];

/**
 * The ant overlay. Off screen by default; when asked to review incorrect boxes
 * it crawls (top-down, legs moving, leaving a fading footprint trail) from box
 * to box, highlighting each and explaining the mistake. When stopped at a box it
 * holds its legs still and only the head/antennae move. On dismiss it walks off
 * the bottom of the screen. Auto-dismisses if the boxes leave the DOM.
 */
export default function AntMascot() {
  const {
    active,
    current,
    index,
    stops,
    message,
    thinking,
    next,
    prev,
    dismiss,
  } = useMascot();
  const reduce = useReducedMotion();

  const [target, setTarget] = useState<{ id: string; rect: Rect } | null>(null);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [moving, setMoving] = useState(false);
  const [exiting, setExiting] = useState(false);
  // True only once the ant has reached the current box, gates the explanation
  // bubble so it appears on arrival, not while the ant is still walking.
  const [arrived, setArrived] = useState(false);
  // Short phrase shown in a little bubble over the ant while it enters / leaves.
  const [quip, setQuip] = useState<string | null>(null);
  // True while the page is gently gliding the target box into view. The ant
  // waits (and rides along with the scroll) until this clears, then walks over.
  const [scrolling, setScrolling] = useState(false);
  // True when a user scroll interrupted the walk: the ant freezes and locks to
  // the page until scrolling stops, then resumes after a short delay.
  const [walkPaused, setWalkPaused] = useState(false);

  // Position. Facing is a slow spring chasing the raw travel heading, so turns
  // (e.g. when clicking Next) ease around gradually instead of snapping.
  const x = useMotionValue(vw() / 2);
  const y = useMotionValue(vh() + 48);
  const headingRaw = useMotionValue(0);
  const rotate = useSpring(headingRaw, { stiffness: 18, damping: 9 });

  // Highlight halo geometry as motion values so it's driven straight off the
  // live box rect on every scroll tick (no React-render lag), so it stays exactly
  // pinned to the box and doesn't drift during scrolling.
  const haloTop = useMotionValue(0);
  const haloLeft = useMotionValue(0);
  const haloW = useMotionValue(0);
  const haloH = useMotionValue(0);

  const lastSample = useRef<{ x: number; y: number } | null>(null);
  const stepAccum = useRef(0);
  const footSide = useRef(1);
  const footId = useRef(0);
  const prevHeading = useRef(0);
  const movingRef = useRef(false);
  const velX = useRef(0);
  const velY = useRef(0);
  const quipToken = useRef(0);
  const wasActive = useRef(false);
  // Mirrors of state read inside scroll handlers (avoids stale closures), plus
  // the debounced timer that resumes walking after a user scroll settles.
  const walkPausedRef = useRef(false);
  const scrollingRef = useRef(false);
  const exitingRef = useRef(false);
  const resumeTimer = useRef(0);
  // Entrance bookkeeping: `entering` is true from activation until the ant
  // reaches its first box; the quip is held back until the ant is on screen.
  const enteringRef = useRef(false);
  const entranceQuipShownRef = useRef(false);

  const startMoving = useCallback(() => {
    if (!movingRef.current) {
      movingRef.current = true;
      setMoving(true);
      setArrived(false);
    }
  }, []);
  const stopMoving = useCallback(() => {
    if (movingRef.current) {
      movingRef.current = false;
      setMoving(false);
    }
  }, []);

  useEffect(() => {
    scrollingRef.current = scrolling;
  }, [scrolling]);
  useEffect(() => {
    exitingRef.current = exiting;
  }, [exiting]);

  const clearResume = useCallback(() => {
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = 0;
    }
  }, []);
  // Freeze the ant in place (legs stop) and lock it to the page while the user
  // scrolls; reset motion bookkeeping so it resumes cleanly afterward.
  const pauseWalk = useCallback(() => {
    walkPausedRef.current = true;
    setWalkPaused(true);
    stopMoving();
    velX.current = 0;
    velY.current = 0;
    lastSample.current = null;
  }, [stopMoving]);
  const resumeWalk = useCallback(() => {
    clearResume();
    walkPausedRef.current = false;
    setWalkPaused(false);
  }, [clearResume]);
  const cancelPause = useCallback(() => {
    clearResume();
    walkPausedRef.current = false;
    setWalkPaused(false);
  }, [clearResume]);
  // (Re)start the 1s countdown to resume walking; each scroll tick pushes it
  // back, so it only fires once the user actually stops scrolling.
  const scheduleResume = useCallback(() => {
    clearResume();
    resumeTimer.current = window.setTimeout(resumeWalk, RESUME_DELAY_MS);
  }, [clearResume, resumeWalk]);
  useEffect(() => clearResume, [clearResume]);

  const showQuip = useCallback((text: string, autoHideMs?: number) => {
    const token = ++quipToken.current;
    setQuip(text);
    if (autoHideMs) {
      window.setTimeout(() => {
        if (quipToken.current === token) setQuip(null);
      }, autoHideMs);
    }
  }, []);
  const hideQuip = useCallback(() => {
    quipToken.current += 1;
    setQuip(null);
  }, []);
  // Teleport the ant just past a random edge of the viewport so each rescue
  // marches in from a fresh direction (otherwise it would always re-enter from
  // wherever the previous tour left it parked off the bottom).
  const spawnOffscreen = useCallback(
    (aimX?: number, aimY?: number) => {
      const w = vw();
      const h = vh();
      const margin = SPAWN_MARGIN;
      const edge = Math.floor(Math.random() * 4);
      let sx: number;
      let sy: number;
      switch (edge) {
        case 0: // top
          sx = Math.random() * w;
          sy = -margin;
          break;
        case 1: // right
          sx = w + margin;
          sy = Math.random() * h;
          break;
        case 2: // bottom
          sx = Math.random() * w;
          sy = h + margin;
          break;
        default: // left
          sx = -margin;
          sy = Math.random() * h;
          break;
      }
      x.set(sx);
      y.set(sy);
      // Reset motion bookkeeping so it doesn't carry stale velocity/heading.
      velX.current = 0;
      velY.current = 0;
      lastSample.current = { x: sx, y: sy };
      stepAccum.current = 0;
      // Face toward the aim point (its eventual target, else screen center) so
      // it enters pointing the right way.
      const tx = aimX ?? w / 2;
      const ty = aimY ?? h / 2;
      const a = (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI + 90;
      prevHeading.current = a;
      headingRaw.set(a);
      return { sx, sy };
    },
    [x, y, headingRaw],
  );

  // Start the entrance: flag it, hold the quip back (shown only once the ant is
  // actually on screen), and clear any stale quip.
  const beginEntrance = useCallback(() => {
    enteringRef.current = true;
    entranceQuipShownRef.current = false;
    setArrived(false);
    hideQuip();
  }, [hideQuip]);
  // Wipe every trace of the ant when a tour ends (e.g. the learner clicks Next
  // to move to the following question) so the next tour starts from a clean slate.
  const resetOverlay = useCallback(() => {
    hideQuip();
    stopMoving();
    cancelPause();
    enteringRef.current = false;
    entranceQuipShownRef.current = false;
    scrollingRef.current = false;
    setExiting(false);
    setArrived(false);
    setScrolling(false);
    setFootprints([]);
  }, [hideQuip, stopMoving, cancelPause]);

  const dropFootprint = useCallback((cx: number, cy: number, rotDeg: number) => {
    const theta = ((rotDeg - 90) * Math.PI) / 180; // travel direction
    const side = (footSide.current = -footSide.current);
    const fx = Math.cos(theta); // forward (travel) unit vector
    const fy = Math.sin(theta);
    const lx = -Math.sin(theta); // lateral (perpendicular) unit vector
    const ly = Math.cos(theta);
    // One tripod side per stride: drop a print from the front and the rear leg
    // on that side (alternating left/right each step). `fwd` is the offset along
    // the travel axis (negative = behind center), `lat` the sideways offset.
    const feet = [
      { fwd: -13, lat: 12 }, // rear leg (behind the body)
      { fwd: 9, lat: 14 }, // front leg (ahead of the body)
    ];
    const prints = feet.map(({ fwd, lat }) => {
      const id = ++footId.current;
      const ox = cx + fx * fwd + lx * lat * side;
      const oy = cy + fy * fwd + ly * lat * side;
      window.setTimeout(
        () => setFootprints((prev) => prev.filter((f) => f.id !== id)),
        1400,
      );
      return { id, x: ox, y: oy, rot: rotDeg };
    });
    setFootprints((prev) => [...prev, ...prints]);
  }, []);

  const sample = useCallback(() => {
    const cx = x.get();
    const cy = y.get();
    const last = lastSample.current;
    if (last) {
      const dx = cx - last.x;
      const dy = cy - last.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.06) {
        // Unwrap the heading so the facing spring turns the short way.
        let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const prevA = prevHeading.current;
        while (a - prevA > 180) a -= 360;
        while (a - prevA < -180) a += 360;
        prevHeading.current = a;
        headingRaw.set(a);
        startMoving();
      }
      if (!reduce) {
        stepAccum.current += d;
        while (stepAccum.current >= STEP_PX) {
          stepAccum.current -= STEP_PX;
          dropFootprint(cx, cy, headingRaw.get());
        }
      }
    }
    lastSample.current = { x: cx, y: cy };
  }, [x, y, headingRaw, reduce, dropFootprint, startMoving]);

  const beginExit = useCallback(() => {
    setExiting(true);
    startMoving();
    showQuip(pickQuip(FAREWELL_QUIPS));
  }, [startMoving, showQuip]);

  // On activation: park the ant fully off screen and flag the entrance. The
  // box-measuring effect then scrolls the box into view, re-spawns + aims the
  // ant once the scroll settles, and the walk-on begins (quip pops on screen).
  useEffect(() => {
    if (active && !wasActive.current) {
      spawnOffscreen();
      beginEntrance();
    }
    if (!active && wasActive.current) resetOverlay();
    wasActive.current = active;
  }, [active, spawnOffscreen, beginEntrance, resetOverlay]);

  // Find + measure the current box; scroll it into view; auto-dismiss if gone.
  useEffect(() => {
    if (!active || !current || exiting) return;
    const boxId = current.id;
    const selector = `[data-ant-box="${boxId}"]`;
    const find = () => document.querySelector<HTMLElement>(selector);
    const el = find();
    if (!el) {
      dismiss();
      return;
    }
    const measure = (node: HTMLElement) => {
      const r = node.getBoundingClientRect();
      setTarget({ id: boxId, rect: toRect(r) });
      // Pin the halo straight to the live rect (synchronous, lag-free).
      haloTop.set(r.top - 6);
      haloLeft.set(r.left - 6);
      haloW.set(r.width + 12);
      haloH.set(r.height + 12);
    };
    measure(el);

    // Scroll the box fully into view *before* the ant moves: the ant idles
    // (parked off screen during the entrance) until `scrolling` clears, then
    // walks over.
    setArrived(false);
    stopMoving();
    cancelPause();
    scrollingRef.current = true;
    setScrolling(true);
    const onScrollDone = () => {
      // On the entrance, now that the layout has settled, (re)spawn the ant
      // fully off screen and aim its heading at the box it's about to walk to.
      if (enteringRef.current) {
        const node = find();
        const r = node ? toRect(node.getBoundingClientRect()) : null;
        if (r) {
          const { cx, cy } = antTargetFor(r);
          spawnOffscreen(cx, cy);
        } else {
          spawnOffscreen();
        }
      }
      scrollingRef.current = false;
      setScrolling(false);
    };
    const cancelScroll = smoothCenter(el, SCROLL_MS, onScrollDone);

    const interval = window.setInterval(() => {
      const node = find();
      if (!node) dismiss();
      else measure(node);
    }, 250);
    const onScrollResize = () => {
      const node = find();
      if (node) measure(node);
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      cancelScroll();
      window.clearInterval(interval);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [
    active,
    current,
    index,
    exiting,
    dismiss,
    stopMoving,
    cancelPause,
    spawnOffscreen,
  ]);

  // Keep the ant glued to the page while it's not actively walking, and handle
  // a user scroll that interrupts a walk: freeze + lock the ant, then resume
  // walking once scrolling settles (after RESUME_DELAY_MS). Shifting the ant by
  // the scroll delta keeps it fixed relative to the on-page elements (and lets
  // it slide under the top/bottom bars) instead of hovering at a viewport spot.
  useEffect(() => {
    if (!active || !current) return;
    const el = document.querySelector<HTMLElement>(
      `[data-ant-box="${current.id}"]`,
    );
    const scroller = el ? scrollableAncestor(el) : null;
    if (!scroller) return;
    let last = scroller.scrollTop;
    const onScroll = () => {
      const cur = scroller.scrollTop;
      const d = cur - last;
      last = cur;
      if (!d || exitingRef.current) return;
      // A scroll while the ant is mid-walk (not the programmatic scroll-to-box)
      // is the user taking over: stop and lock the ant to the page.
      const userScrollDuringWalk =
        movingRef.current && !scrollingRef.current && !walkPausedRef.current;
      if (userScrollDuringWalk) pauseWalk();
      // Lock to the page whenever the ant isn't actively stepping, except
      // during the entrance scroll, where it stays parked fully off screen.
      const entranceScroll = scrollingRef.current && enteringRef.current;
      if ((walkPausedRef.current || !movingRef.current) && !entranceScroll) {
        y.set(y.get() - d);
      }
      // While paused, keep pushing the resume countdown back until scroll stops.
      if (walkPausedRef.current) scheduleResume();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [active, current, y, pauseWalk, scheduleResume]);

  const rect =
    active && current && target && target.id === current.id
      ? target.rect
      : null;

  const hasTarget = rect != null;
  const antTarget = rect ? antTargetFor(rect) : null;
  const antCx = antTarget ? antTarget.cx : Math.round(vw() / 2);
  const antCy = antTarget ? antTarget.cy : Math.round(vh() / 2);

  // Crawl toward the current target (or off the bottom of the screen on exit)
  // along a smooth curved path (velocity has momentum), easing speed down on
  // arrival, then stop (legs freeze).
  useEffect(() => {
    // Wait for the scroll-into-view to finish before walking; pause while the
    // user scrolls; once parked at a box, stay put (the page-glue effect handles
    // scroll) instead of re-chasing.
    if (
      !active ||
      (!exiting && (scrolling || arrived || walkPaused || !hasTarget))
    )
      return;
    const targetX = exiting ? x.get() : antCx;
    const targetY = exiting ? vh() + 110 : antCy;

    const arrive = () => {
      stopMoving();
      if (exiting) {
        setExiting(false);
        dismiss();
      } else {
        enteringRef.current = false;
        setArrived(true);
        hideQuip();
      }
    };

    // Pop the rescue quip the moment the ant is actually visible on screen
    // (during the entrance walk-on), not while it's still off screen.
    const maybeShowEntranceQuip = () => {
      if (
        !enteringRef.current ||
        entranceQuipShownRef.current ||
        exiting
      )
        return;
      const cx = x.get();
      const cy = y.get();
      if (cx >= 0 && cx <= vw() && cy >= 44 && cy <= vh()) {
        entranceQuipShownRef.current = true;
        showQuip(pickQuip(RESCUE_QUIPS), 2600);
      }
    };

    if (reduce) {
      x.set(targetX);
      y.set(targetY);
      arrive();
      return;
    }

    startMoving();
    let raf = 0;
    let prevT = performance.now();
    const step = (now: number) => {
      // A user scroll may pause mid-frame; bail immediately so the ant freezes
      // and the page-glue takes over (the effect re-run also cancels this raf).
      if (walkPausedRef.current && !exiting) return;
      const dt = Math.min(0.05, (now - prevT) / 1000);
      prevT = now;

      const px = x.get();
      const py = y.get();
      const dx = targetX - px;
      const dy = targetY - py;
      const dist = Math.hypot(dx, dy);

      if (dist < STOP_R) {
        velX.current = 0;
        velY.current = 0;
        arrive();
        return;
      }

      // Seek the target, slowing down inside the arrival radius.
      const t = Math.min(1, dist / ARRIVE_R);
      const speed = MAX_SPEED * Math.max(0.4, t);
      const desVx = (dx / dist) * speed;
      const desVy = (dy / dist) * speed;

      // Ease velocity toward the desired heading so the ant arcs into the
      // target (momentum) rather than turning instantly, for a smooth curved path.
      // Steer harder once close so it still commits cleanly to the box.
      const steer = Math.min(1, (dist < ARRIVE_R ? 6 : 2.4) * dt);
      velX.current += (desVx - velX.current) * steer;
      velY.current += (desVy - velY.current) * steer;

      x.set(px + velX.current * dt);
      y.set(py + velY.current * dt);
      sample();
      maybeShowEntranceQuip();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [
    active,
    hasTarget,
    antCx,
    antCy,
    exiting,
    scrolling,
    arrived,
    walkPaused,
    reduce,
    x,
    y,
    sample,
    startMoving,
    stopMoving,
    dismiss,
    hideQuip,
    showQuip,
  ]);

  if (!active || !current || !rect) return null;

  const isLast = index >= stops.length - 1;

  // Anchor the explanation bubble to the ant's resting spot so it reads as a
  // speech bubble coming out of its head. Flip above/below + clamp horizontally
  // to stay on screen, and point the little tail back at the ant.
  const BUBBLE_W = 256;
  const GAP = 30; // distance from the ant to the bubble edge
  const bubbleAbove = antCy > 210;
  const bubbleLeft = Math.min(
    Math.max(antCx - BUBBLE_W / 2, 10),
    vw() - BUBBLE_W - 10,
  );
  const bubbleAnchorTop = bubbleAbove ? antCy - GAP : antCy + GAP;

  return (
    <>
    {/* Ant, footprints + halo sit *under* the top/bottom bars (z below them). */}
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Footprint trail */}
      {footprints.map((f) => (
        <span
          key={f.id}
          className="ant-footprint absolute h-1 w-2 rounded-full bg-brand-700/50"
          style={
            {
              left: f.x,
              top: f.y,
              "--foot-rot": `${f.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Highlight halo, placed once the box has scrolled into view, and
          driven off the live box rect (motion values) so it stays exactly
          pinned to the box and never drifts during scroll. Hidden on exit. */}
      {!exiting && !scrolling && (
        <motion.div
          className="pointer-events-none absolute rounded-xl ring-4 ring-amber-400/70"
          style={{
            top: haloTop,
            left: haloLeft,
            width: haloW,
            height: haloH,
          }}
          initial={false}
          animate={{ opacity: reduce ? 1 : [0.55, 1, 0.55] }}
          transition={{
            opacity: reduce
              ? { duration: 0.2 }
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      )}

      {/* The ant (with an optional quip riding above it on entrance/exit) */}
      <motion.div className="absolute left-0 top-0" style={{ x, y }}>
        <div style={{ transform: "translate(-50%, -50%)" }}>
          <motion.div style={{ rotate }}>
            <AntSvg
              mood="encouraging"
              walking={moving}
              className="h-12 w-12 drop-shadow-md sm:h-14 sm:w-14"
            />
          </motion.div>
        </div>
        <AnimatePresence>
          {quip && (
            <motion.div
              key={quip}
              className="absolute whitespace-nowrap rounded-2xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
              style={{ left: 0, top: 0, transform: "translate(-50%, -260%)" }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {quip}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-brand-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>

    {/* Explanation bubble in its own layer *above* the bars (z above them) so
        it can overlap the quiz progress bar. Only once the ant has arrived. */}
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <AnimatePresence mode="wait">
        {arrived && !exiting && (
          <motion.div
            key={current.id}
            className="pointer-events-auto absolute w-64 max-w-[80vw] rounded-2xl bg-white px-4 py-3 text-sm text-stone-700 shadow-xl ring-1 ring-amber-200"
            style={{
              left: bubbleLeft,
              top: bubbleAnchorTop,
              y: bubbleAbove ? "-100%" : 0,
              transformOrigin: bubbleAbove ? "bottom center" : "top center",
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18 }}
          >
            <button
              onClick={beginExit}
              aria-label="Dismiss Andi"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-500 shadow transition hover:bg-stone-300"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-stone-900">{current.title}</p>
              {stops.length > 1 && (
                <span className="text-[11px] font-semibold text-stone-400">
                  {index + 1}/{stops.length}
                </span>
              )}
            </div>

            {thinking ? (
              <ThinkingDots />
            ) : (
              <p className="mt-0.5 leading-snug">{message}</p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              {index > 0 && (
                <button
                  onClick={prev}
                  className="rounded-lg px-2 py-1.5 text-xs font-bold text-stone-500 transition hover:bg-stone-100"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  // Fix this box (fill the correct value + turn it yellow-green)
                  // before walking on to the next one / leaving.
                  current.fix?.();
                  if (isLast) {
                    beginExit();
                  } else {
                    next();
                  }
                }}
                className="ml-auto rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600"
              >
                {isLast ? "Got it" : "Next"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

function ThinkingDots() {
  return (
    <p className="mt-0.5 flex items-center gap-1 leading-snug text-stone-500">
      <span>Thinking</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </p>
  );
}
