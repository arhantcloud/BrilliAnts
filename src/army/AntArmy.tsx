import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../progress/progress-context";
import { shortTitle } from "../content/shortTitles";
import { course } from "../content/course";
import type { ArmyAnt } from "../types";
import { ARMY_TOPIC_IDS, neighborsAllowGeneral } from "./config";
import { isEligible } from "./antState";
import { RANK_VISUALS, RankBadge } from "./rankVisuals";
import Anthill from "./Anthill";
import CourseBadge from "./CourseBadge";
import UpgradeSession from "./UpgradeSession";
import RecruitSession from "./RecruitSession";

/**
 * Hand-tuned, scattered positions (percent of the field) for the six anthills,
 * so the base reads as an organic Clash-of-Clans layout rather than a tidy grid.
 * Anchored at each hill's centre.
 */
const SCATTER = [
  { left: "28%", top: "11%" },
  { left: "70%", top: "20%" },
  { left: "47%", top: "39%" },
  { left: "25%", top: "58%" },
  { left: "72%", top: "69%" },
  { left: "49%", top: "88%" },
] as const;

/** Small seeded RNG for the decorative grass/pebble texture (stable per mount). */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A top-down grassy ground layer: scattered tufts, pebbles, and a dirt path.
 *  Memoised (no props) so it never re-renders when the parent does. */
const GroundTexture = memo(function GroundTexture() {
  // A tall viewBox matching the field's aspect ratio so `slice` barely crops and
  // the tufts spread evenly across the whole base instead of bunching up top.
  const W = 400;
  const H = 900;
  const els = useMemo(() => {
    const rnd = mulberry32(0xa17a4);
    const tufts = Array.from({ length: 120 }, (_, i) => {
      const x = rnd() * W;
      const y = rnd() * H;
      return (
        <path
          key={`t${i}`}
          d={`M${x} ${y} l-3 -6 M${x} ${y} l0 -7 M${x} ${y} l3 -6`}
          stroke="#4f7d31"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity={0.5}
        />
      );
    });
    const pebbles = Array.from({ length: 64 }, (_, i) => (
      <circle
        key={`p${i}`}
        cx={rnd() * W}
        cy={rnd() * H}
        r={2 + rnd() * 2}
        fill="#caa66f"
        opacity={0.4}
      />
    ));
    return [...tufts, ...pebbles];
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <path
        d="M210 -20 C 110 120, 300 260, 180 400 S 250 660, 200 920"
        stroke="#b9905a"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {els}
    </svg>
  );
});

/** A single rank chip for the legend. */
function LegendChip({ rank }: { rank: 0 | 1 | 2 }) {
  const v = RANK_VISUALS[rank];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white">
      <RankBadge rank={rank} size={16} />
      {v.label}
    </span>
  );
}

type Active =
  | { kind: "upgrade"; topicId: string; antId: string }
  | { kind: "recruit"; topicId: string }
  | { kind: "antmenu"; topicId: string; antId: string }
  | null;

/**
 * The Ant Army base: a top-down, Clash-of-Clans-style scene of six anthills (one
 * per topic). Ants are recruited from correct answers / freed colony ants, then
 * promoted worker -> warrior -> general through harder upgrade challenges. Mounted
 * below the final exam on the course path.
 */
export default function AntArmy() {
  const navigate = useNavigate();
  const { antArmy: army, anthillTier, devMutateAnt, lessonStatus, battleUnlocked } =
    useProgress();
  const [active, setActive] = useState<Active>(null);

  // Only animate the roaming ants / countdown rings while the scene is actually
  // on screen — otherwise ~30 rAF loops + per-ant timers run constantly and make
  // the whole page (and its scrolling) janky.
  const sceneRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function handleAntClick(topicId: string, ant: ArmyAnt) {
    // Open the per-ant menu (real upgrade challenge + testing shortcuts).
    setActive({ kind: "antmenu", topicId, antId: ant.id });
  }

  const activeTopicLabel =
    active && active.kind !== null
      ? shortTitle(
          active.topicId,
          course.lessons.find((l) => l.id === active.topicId)?.title ??
            active.topicId,
        )
      : "";
  const liveAnt =
    active?.kind === "upgrade" || active?.kind === "antmenu"
      ? (army[active.topicId] ?? []).find((a) => a.id === active.antId)
      : undefined;

  return (
    <section id="ant-army" className="mt-8 scroll-mt-4">
      <div className="overflow-hidden shadow-md">
        {/* Header strip (full-bleed) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#5f8f3c] to-[#4d7a30] px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <CourseBadge />
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ant Army
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <LegendChip rank={0} />
            <LegendChip rank={1} />
            <LegendChip rank={2} />
          </div>
        </div>

        {/* Subtitle strip */}
        <div className="flex items-center justify-between gap-3 bg-lime-50 px-5 py-2 text-xs font-bold text-[#4d7a30] sm:px-8">
          <span>Recruit ants, then promote them through harder challenges.</span>
          {battleUnlocked && (
            <button
              type="button"
              onClick={() => navigate("/battle")}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#4d7a30] px-3 py-1 text-[11px] font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
            >
              <span aria-hidden>⚔️</span> Battle
            </button>
          )}
        </div>

        {/* The grassy base: anthills scattered organically across a large field */}
        <div
          ref={sceneRef}
          className="army-scene relative bg-gradient-to-b from-[#7cae54] to-[#5f8f3c] p-3 sm:p-5"
        >
          <GroundTexture />
          <div className="relative mx-auto h-[1480px] w-full max-w-3xl sm:h-[1120px]">
            {ARMY_TOPIC_IDS.map((topicId, i) => {
              const lesson = course.lessons.find((l) => l.id === topicId);
              const label = shortTitle(topicId, lesson?.title ?? topicId);
              const pos = SCATTER[i] ?? SCATTER[0];
              return (
                <div
                  key={topicId}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    width: "clamp(180px, 48vw, 240px)",
                  }}
                >
                  <Anthill
                    topicId={topicId}
                    topicLabel={label}
                    tier={anthillTier(topicId)}
                    ants={army[topicId] ?? []}
                    active={inView}
                    generalReady={neighborsAllowGeneral(topicId, anthillTier)}
                    recruitUnlocked={lessonStatus(topicId) === "completed"}
                    onAntClick={(ant) => handleAntClick(topicId, ant)}
                    onRecruit={() => setActive({ kind: "recruit", topicId })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {active?.kind === "upgrade" && liveAnt && (
        <UpgradeSession
          topicId={active.topicId}
          ant={liveAnt}
          topicLabel={activeTopicLabel}
          onClose={() => setActive(null)}
        />
      )}
      {active?.kind === "recruit" && (
        <RecruitSession
          topicId={active.topicId}
          topicLabel={activeTopicLabel}
          onClose={() => setActive(null)}
        />
      )}
      {active?.kind === "antmenu" && liveAnt && (
        <AntMenu
          ant={liveAnt}
          topicLabel={activeTopicLabel}
          generalBlocked={
            liveAnt.rank === 1 &&
            !neighborsAllowGeneral(active.topicId, anthillTier)
          }
          onClose={() => setActive(null)}
          onStartUpgrade={() =>
            setActive({
              kind: "upgrade",
              topicId: active.topicId,
              antId: active.antId,
            })
          }
          onMakeReady={() => {
            devMutateAnt(active.topicId, active.antId, "ready");
            setActive(null);
          }}
          onUpgradeNow={() => {
            devMutateAnt(active.topicId, active.antId, "upgrade");
            setActive(null);
          }}
        />
      )}
    </section>
  );
}

/** A small chooser shown when an ant is clicked: the real upgrade challenge plus
 *  testing shortcuts to make an ant eligible or promote it instantly. */
function AntMenu({
  ant,
  topicLabel,
  generalBlocked,
  onClose,
  onStartUpgrade,
  onMakeReady,
  onUpgradeNow,
}: {
  ant: ArmyAnt;
  topicLabel: string;
  /** True when this warrior can't reach general yet: a neighbour anthill is
   *  not tier 1. */
  generalBlocked: boolean;
  onClose: () => void;
  onStartUpgrade: () => void;
  onMakeReady: () => void;
  onUpgradeNow: () => void;
}) {
  const v = RANK_VISUALS[ant.rank];
  const eligible = isEligible(ant) && !generalBlocked;
  const maxed = ant.rank >= 2;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <RankBadge rank={ant.rank} size={22} />
          <div>
            <p className="text-sm font-extrabold text-stone-800">{v.label}</p>
            <p className="text-[11px] font-semibold text-stone-500">
              {topicLabel}
            </p>
          </div>
        </div>

        {maxed ? (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            This ant is a general — already at the highest rank.
          </p>
        ) : (
          <>
            {generalBlocked && (
              <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Fortify the neighbouring anthills to tier 1 before promoting this
                warrior to a general.
              </p>
            )}
            <button
              type="button"
              onClick={onStartUpgrade}
              disabled={!eligible}
              className="mb-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {eligible
                ? "Start upgrade challenge"
                : generalBlocked
                  ? "Neighbours not fortified yet"
                  : "Not ready to upgrade yet"}
            </button>
          </>
        )}

        <div className="mt-3 border-t border-stone-200 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">
            Testing shortcuts
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onMakeReady}
              className="flex-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
              title="Make this ant immediately eligible to upgrade"
            >
              ⏱ Make ready
            </button>
            <button
              type="button"
              onClick={onUpgradeNow}
              disabled={maxed || generalBlocked}
              className="flex-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-700 enabled:hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                generalBlocked
                  ? "Fortify neighbouring anthills to tier 1 first"
                  : "Promote this ant one rank instantly"
              }
            >
              ⬆︎ Upgrade now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
