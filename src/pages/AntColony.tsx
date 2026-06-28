import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { course } from "../content/course";
import { shortTitle } from "../content/shortTitles";
import { useProgress } from "../progress/progress-context";
import RoamingAnt from "../colony/RoamingAnt";
import ReviewSession from "../colony/ReviewSession";
import ClimbingAnt from "../colony/ClimbingAnt";
import TargetedLessonModal from "../colony/TargetedLessonModal";
import { describeProblem } from "../colony/problemType";
import type { Mistake } from "../types";

/** A rescued ant currently animating up and out of the colony. */
type LeavingAnt = {
  mistake: Mistake;
  /** SVG path (field-space) the ant crawls along, tracing the tunnels. */
  d: string;
  duration: number;
  /** Start chamber centre, so its tunnel + chamber stay carved during the crawl. */
  startX: number;
  startY: number;
};

const NEST_W = 323; // chamber width (px)
const NEST_H = 185; // chamber height (px)
const ROW_H = 213; // vertical spacing between chambers (0.7x: shorter tunnels)
const TOP_PAD = 64; // room for the surface + entrance tunnel
const BOTTOM_PAD = 46;

type Chamber = {
  id: string;
  label: string;
  ants: Mistake[];
  cx: number;
  cy: number;
};

/** Smooth S-curve tunnel between two chamber centres. */
function tunnelPath(a: { cx: number; cy: number }, b: { cx: number; cy: number }) {
  const midY = (a.cy + b.cy) / 2;
  return `M ${a.cx} ${a.cy} C ${a.cx} ${midY}, ${b.cx} ${midY}, ${b.cx} ${b.cy}`;
}

/**
 * Build the crawl-out path for the ant in chamber `start`: it traces the same
 * tunnel beziers upward through every chamber above it (reversing each curve),
 * then climbs straight up the entrance tunnel to the surface. Returns the SVG
 * `d`, an arc-length estimate, and the deepest y.
 */
function buildClimbPath(chambers: Chamber[], start: number) {
  const s = chambers[start];
  let d = `M ${s.cx} ${s.cy}`;
  let length = 0;
  for (let k = start; k >= 1; k--) {
    const lower = chambers[k];
    const upper = chambers[k - 1];
    const mid = (upper.cy + lower.cy) / 2;
    // Reverse of tunnelPath(upper, lower): same curve, drawn lower→upper.
    d += ` C ${lower.cx} ${mid}, ${upper.cx} ${mid}, ${upper.cx} ${upper.cy}`;
    length += Math.hypot(upper.cx - lower.cx, upper.cy - lower.cy) * 1.12;
  }
  // Out the entrance tunnel (straight up, past the surface).
  const top = chambers[0];
  d += ` L ${top.cx} ${-50}`;
  length += top.cy + 50;
  return { d, length, startX: s.cx, startY: s.cy };
}

/** Deterministic mulberry32 generator (pure, so soil texture is stable). */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AntColony() {
  const navigate = useNavigate();
  const { loading, mistakes, quizPointsEarned, quizPointsTotal } = useProgress();
  const [active, setActive] = useState<Mistake | null>(null);
  // The crawl-out the active ant will take (captured on click, since resolving
  // removes it from context before the animation plays).
  const [activeClimb, setActiveClimb] = useState<{
    d: string;
    duration: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [leaving, setLeaving] = useState<LeavingAnt[]>([]);
  // The nest whose "Ask Andi" targeted lesson is currently open.
  const [tutorNest, setTutorNest] = useState<Chamber | null>(null);

  const fieldRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setViewportH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lessons (in course order) that currently have ants.
  const nests = useMemo(
    () =>
      course.lessons
        .map((l) => ({
          id: l.id,
          label: shortTitle(l.id, l.title),
          ants: mistakes[l.id] ?? [],
        }))
        .filter((n) => n.ants.length > 0),
    [mistakes],
  );

  // Lay the chambers out in a downward zigzag.
  const chambers: Chamber[] = useMemo(() => {
    if (width <= 0) return [];
    const half = NEST_W / 2 + 14;
    const leftX = Math.max(half, width * 0.27);
    const rightX = Math.min(width - half, width * 0.73);
    return nests.map((n, i) => ({
      ...n,
      cx: i % 2 === 0 ? leftX : rightX,
      cy: TOP_PAD + NEST_H / 2 + i * ROW_H,
    }));
  }, [nests, width]);

  const chambersHeight =
    chambers.length > 0
      ? chambers[chambers.length - 1].cy + NEST_H / 2 + BOTTOM_PAD
      : 0;
  // Keep the field tall enough for any ant still climbing out from a lower
  // chamber, even after its chamber has been removed.
  const leavingMaxY = leaving.reduce(
    (m, l) => Math.max(m, l.startY + NEST_H / 2 + BOTTOM_PAD),
    0,
  );
  const contentHeight = Math.max(chambersHeight, leavingMaxY);
  // The colony fills the whole area below the header: it's at least as tall as
  // the viewport, and grows (scrolls) when there are more chambers than fit.
  const fieldHeight = Math.max(contentHeight, viewportH);

  // Scattered pebbles/grains for soil texture (stable per size).
  const pebbles = useMemo(() => {
    if (width <= 0 || fieldHeight <= 0) return [];
    const count = Math.floor((width * fieldHeight) / 14000);
    const rng = makeRng(Math.floor(width) * 131 + Math.floor(fieldHeight) * 17 + 7);
    return Array.from({ length: count }, () => ({
      x: rng() * width,
      y: TOP_PAD + rng() * (fieldHeight - TOP_PAD),
      r: 1 + rng() * 2.5,
      o: 0.08 + rng() * 0.12,
    }));
  }, [width, fieldHeight]);

  const totalAnts = nests.reduce((sum, n) => sum + n.ants.length, 0);
  // Hold the colony view open while any ant is still climbing out.
  const showEmpty = totalAnts === 0 && leaving.length === 0;
  // The point is already recovered in context, but we hide it on the bar until
  // its ant finishes climbing out, so the bar ticks up as the ant disappears.
  const displayedEarned = Math.max(0, quizPointsEarned - leaving.length);
  const quizPct =
    quizPointsTotal > 0
      ? Math.round((displayedEarned / quizPointsTotal) * 100)
      : 0;
  const activeLabel = active
    ? shortTitle(
        active.lessonId,
        course.lessons.find((l) => l.id === active.lessonId)?.title ??
          active.lessonId,
      )
    : "";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-stone-400">
        Loading the colony...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#2a1a0e]">
      <header className="bg-gradient-to-b from-[#7cae54] to-[#5f8f3c] px-5 pb-6 pt-8 text-white shadow-md sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              aria-label="Back to course"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/15 text-white hover:bg-black/25"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div>
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-lime-100">
                <span aria-hidden>🐜</span> Ant Colony
              </p>
              <h1 className="mt-0.5 text-xl font-extrabold leading-tight drop-shadow-sm">
                Review your mistakes
              </h1>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-lime-100">
              <span className="flex items-center gap-1">
                <span aria-hidden>🎯</span>
                Quiz points · {displayedEarned} / {quizPointsTotal}
              </span>
              <span>{quizPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-200 to-yellow-300 transition-all duration-500"
                style={{ width: `${quizPct}%` }}
              />
            </div>

            {!showEmpty && (
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-xl bg-black/20 p-3 ring-1 ring-white/15">
                  <span className="text-lg leading-none" aria-hidden>
                    🐜
                  </span>
                  <p className="text-sm leading-snug text-lime-50">
                    <span className="font-bold text-white">Free the ants.</span>{" "}
                    Each ant is a question you missed. Hover to see its type, then
                    tap it to answer{" "}
                    <span className="font-semibold text-white">two</span> fresh
                    questions to free it — every freed ant marches off to{" "}
                    <span className="font-semibold text-white">
                      join your Ant Army
                    </span>
                    .
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-black/20 p-3 ring-1 ring-white/15">
                  <span className="text-lg leading-none" aria-hidden>
                    ✨
                  </span>
                  <p className="text-sm leading-snug text-lime-50">
                    <span className="font-bold text-white">Need a refresher?</span>{" "}
                    Tap a nest&rsquo;s{" "}
                    <span className="font-semibold text-white">title</span> (the ✨
                    label) to replay 2 key slides, then{" "}
                    <span className="font-semibold text-white">spot the slip</span>{" "}
                    in a rookie ant&rsquo;s solution and explain what went wrong.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto">
        {showEmpty ? (
          <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
            <div className="rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-100">
              <p className="text-4xl">🎉</p>
              <p className="mt-2 font-bold text-emerald-800">
                The colony is empty!
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                You've cleared every quiz mistake. Nice work.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
              >
                Back to course path
              </button>
            </div>
          </div>
          ) : (
            <>
              {/* The dug-out colony: fills the whole area below the header. */}
              <div
                ref={fieldRef}
                className="relative w-full flex-1 overflow-hidden"
                style={{
                  minHeight: contentHeight,
                  background:
                    "linear-gradient(180deg,#6b4a2d 0%,#553a22 22%,#42301c 55%,#311f10 100%)",
                }}
              >
                {/* Soil tunnels + chambers. */}
                {width > 0 && fieldHeight > 0 && (
                  <svg
                    className="absolute inset-0"
                    width={width}
                    height={fieldHeight}
                    aria-hidden
                  >
                    <defs>
                      <radialGradient id="chamberFill" cx="50%" cy="42%" r="70%">
                        <stop offset="0%" stopColor="#1c1206" />
                        <stop offset="70%" stopColor="#3a2715" />
                        <stop offset="100%" stopColor="#5a3f25" />
                      </radialGradient>
                    </defs>

                    {/* Texture grains. */}
                    {pebbles.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={p.r}
                        fill="#000"
                        opacity={p.o}
                      />
                    ))}

                    {/* Surface entrance tunnel down to the first chamber. */}
                    {chambers[0] && (
                      <path
                        d={`M ${chambers[0].cx} 0 L ${chambers[0].cx} ${chambers[0].cy}`}
                        stroke="#3a2715"
                        strokeWidth={43}
                        strokeLinecap="round"
                        fill="none"
                      />
                    )}

                    {/* Tunnels between chambers (dug channel + darker core). */}
                    {chambers.slice(1).map((c, i) => {
                      const d = tunnelPath(chambers[i], c);
                      return (
                        <g key={`t-${c.id}`}>
                          <path
                            d={d}
                            stroke="#5a3f25"
                            strokeWidth={46}
                            strokeLinecap="round"
                            fill="none"
                          />
                          <path
                            d={d}
                            stroke="#3a2715"
                            strokeWidth={26}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </g>
                      );
                    })}

                    {/* Carved route for any ant still climbing out, keeps its
                        tunnel + chamber visible until it reaches the surface,
                        even after the lesson's chamber has been removed. */}
                    {leaving.map((l) => (
                      <g key={`lt-${l.mistake.id}`}>
                        <path
                          d={l.d}
                          stroke="#5a3f25"
                          strokeWidth={46}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d={l.d}
                          stroke="#3a2715"
                          strokeWidth={26}
                          strokeLinecap="round"
                          fill="none"
                        />
                        <ellipse
                          cx={l.startX}
                          cy={l.startY}
                          rx={NEST_W / 2}
                          ry={NEST_H / 2}
                          fill="url(#chamberFill)"
                          stroke="#6b4a2d"
                          strokeWidth={3}
                        />
                      </g>
                    ))}

                    {/* Chambers. */}
                    {chambers.map((c) => (
                      <g key={`c-${c.id}`}>
                        <ellipse
                          cx={c.cx}
                          cy={c.cy}
                          rx={NEST_W / 2}
                          ry={NEST_H / 2}
                          fill="url(#chamberFill)"
                          stroke="#6b4a2d"
                          strokeWidth={3}
                        />
                        <ellipse
                          cx={c.cx}
                          cy={c.cy - 7}
                          rx={NEST_W / 2 - 13}
                          ry={NEST_H / 2 - 13}
                          fill="none"
                          stroke="#000"
                          strokeOpacity={0.25}
                          strokeWidth={10}
                        />
                      </g>
                    ))}
                  </svg>
                )}

                {/* Ant + label layer (clicks pass through to ants only). */}
                <div className="pointer-events-none absolute inset-0">
                  {chambers.map((c, ci) => (
                    <div
                      key={`h-${c.id}`}
                      className="absolute"
                      style={{
                        left: c.cx - NEST_W / 2,
                        top: c.cy - NEST_H / 2,
                        width: NEST_W,
                        height: NEST_H,
                      }}
                    >
                      {/* Chamber sign — clickable: opens this nest's targeted
                          review (key slides). The sparkle + hover ring signal
                          that the title is interactive. */}
                      <button
                        type="button"
                        onClick={() => setTutorNest(c)}
                        aria-label={`Open targeted review for ${c.label}`}
                        className="group pointer-events-auto absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-900/90 px-3.5 py-1 text-[17px] font-bold text-amber-50 shadow ring-1 ring-amber-400/40 transition hover:bg-amber-800 hover:ring-2 hover:ring-amber-300 active:scale-95"
                      >
                        <span aria-hidden>✨</span>
                        <span className="underline decoration-amber-400/50 decoration-dotted underline-offset-2 group-hover:decoration-amber-200">
                          {c.label}
                        </span>
                        <span className="rounded-full bg-amber-400/90 px-1.5 text-amber-950">
                          {c.ants.length}
                        </span>
                      </button>

                      {c.ants.map((ant) => (
                        <RoamingAnt
                          key={ant.id}
                          field={{ w: NEST_W, h: NEST_H }}
                          label={`Review: ${describeProblem(ant)}`}
                          problemType={describeProblem(ant)}
                          onClick={() => {
                            setActive(ant);
                            // Trace the carved tunnels up and out the entrance.
                            const { d, length, startX, startY } =
                              buildClimbPath(chambers, ci);
                            setActiveClimb({
                              d,
                              duration: Math.min(5, Math.max(1.4, length / 120)),
                              startX,
                              startY,
                            });
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Rescued ants climbing out the entrance tunnel. */}
                <div className="pointer-events-none absolute inset-0">
                  {leaving.map((l) => (
                    <ClimbingAnt
                      key={l.mistake.id}
                      d={l.d}
                      duration={l.duration}
                      onDone={() =>
                        setLeaving((prev) =>
                          prev.filter((p) => p.mistake.id !== l.mistake.id),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}
      </main>

      {active && (
        <ReviewSession
          mistake={active}
          lessonLabel={activeLabel}
          onClose={() => {
            setActive(null);
            setActiveClimb(null);
          }}
          onResolved={(m) => {
            if (activeClimb) {
              setLeaving((prev) => [...prev, { mistake: m, ...activeClimb }]);
            }
          }}
        />
      )}

      {tutorNest && (
        <TargetedLessonModal
          nest={{
            id: tutorNest.id,
            label: tutorNest.label,
            ants: tutorNest.ants,
          }}
          onClose={() => setTutorNest(null)}
        />
      )}
    </div>
  );
}
