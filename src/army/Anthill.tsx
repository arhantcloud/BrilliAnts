import { memo, useEffect, useRef, useState } from "react";
import type { AntRank, ArmyAnt as ArmyAntData } from "../types";
import ArmyAnt from "./ArmyAnt";
import { isEligible } from "./antState";
import { anthillCap, isButtonTopic, topicAccent } from "./config";

const FIELD_H = 240;

/** Measure a container's live width so ants can roam within real pixels. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setW(entries[0].contentRect.width);
    });
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* --------------------------------- the mound -------------------------------- */

/**
 * The anthill itself, drawn as one of three tiers:
 *  - 0 dirt mound: stacked earth ellipses with a dark entrance and pebbles.
 *  - 1 fortified: + a ring of vertical log palisades, a plank gate, a pennant.
 *  - 2 fortress: + a stone-block ring, two accent banners, a glowing gate, sparkles.
 */
/** The anthill mound SVG. Memoised so the (heavy) node tree isn't reconciled
 *  on every parent re-render — its props are primitive, so it only updates when
 *  the tier/accent actually change. */
export const AnthillMound = memo(function AnthillMound({
  tier,
  accent,
  idPrefix,
}: {
  tier: AntRank;
  accent: string;
  idPrefix: string;
}) {
  // Tier 0 (worker hill): a simple side-view brown dirt mound with a burrow.
  if (tier === 0) {
    const shId = `${idPrefix}-t0sh`;
    const soilId = `${idPrefix}-t0soil`;
    return (
      <svg
        viewBox="0 0 220 150"
        className="pointer-events-none absolute left-1/2 w-[170px] -translate-x-1/2"
        style={{ bottom: 56 }}
        aria-hidden
      >
        <defs>
          <radialGradient id={shId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1206" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1c1206" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={soilId} cx="40%" cy="24%" r="95%">
            <stop offset="0%" stopColor="#a84b2a" />
            <stop offset="55%" stopColor="#863a20" />
            <stop offset="100%" stopColor="#57291c" />
          </radialGradient>
        </defs>
        {/* Soft contact shadow */}
        <ellipse cx="112" cy="132" rx="98" ry="18" fill={`url(#${shId})`} />
        {/* Main mound */}
        <path d="M14 134 C 30 92, 66 62, 104 62 C 150 62, 190 94, 206 134 Z" fill={`url(#${soilId})`} />
        {/* Loose clods around the base */}
        <ellipse cx="26" cy="130" rx="18" ry="11" fill={`url(#${soilId})`} />
        <ellipse cx="46" cy="135" rx="13" ry="8" fill={`url(#${soilId})`} />
        <ellipse cx="13" cy="140" rx="10" ry="6" fill={`url(#${soilId})`} />
        <ellipse cx="190" cy="130" rx="19" ry="12" fill={`url(#${soilId})`} />
        <ellipse cx="168" cy="136" rx="12" ry="8" fill={`url(#${soilId})`} />
        <ellipse cx="208" cy="140" rx="10" ry="6" fill={`url(#${soilId})`} />
        {/* Small entrance hole at the very top */}
        <ellipse cx="104" cy="67" rx="16" ry="5" fill="#2f1d0d" />
      </svg>
    );
  }

  // Tier 1 (fortified hill): the dirt mound flanked by two identical mounds
  // sitting behind it, with a pennant flag planted on all three.
  if (tier === 1) {
    const shId = `${idPrefix}-t1sh`;
    const soilId = `${idPrefix}-t1soil`;
    const moundPath = "M14 134 C 30 92, 66 62, 104 62 C 150 62, 190 94, 206 134 Z";
    const flag = (x: number, y: number, h: number) => (
      <g>
        <rect x={x - 0.9} y={y - h} width="1.8" height={h} rx="0.9" fill="#5a3f25" />
        <path d={`M${x + 0.9} ${y - h} L${x + 15} ${y - h + 5} L${x + 0.9} ${y - h + 10} Z`} fill={accent} />
      </g>
    );
    return (
      <svg
        viewBox="0 0 220 150"
        className="pointer-events-none absolute left-1/2 w-[170px] -translate-x-1/2"
        style={{ bottom: 56 }}
        aria-hidden
      >
        <defs>
          <radialGradient id={shId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1206" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1c1206" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={soilId} cx="40%" cy="24%" r="95%">
            <stop offset="0%" stopColor="#a84b2a" />
            <stop offset="55%" stopColor="#863a20" />
            <stop offset="100%" stopColor="#57291c" />
          </radialGradient>
        </defs>
        {/* Soft contact shadow */}
        <ellipse cx="112" cy="132" rx="98" ry="18" fill={`url(#${shId})`} />

        {/* Two identical mounds tucked behind, slightly smaller and shaded */}
        <g transform="translate(-8 24) scale(0.58)">
          <path d={moundPath} fill={`url(#${soilId})`} />
          <ellipse cx="104" cy="67" rx="16" ry="5" fill="#2f1d0d" />
          <path d={moundPath} fill="#3a2410" opacity="0.18" />
        </g>
        <g transform="translate(78 24) scale(0.58)">
          <path d={moundPath} fill={`url(#${soilId})`} />
          <ellipse cx="104" cy="67" rx="16" ry="5" fill="#2f1d0d" />
          <path d={moundPath} fill="#3a2410" opacity="0.18" />
        </g>

        {/* Front mound */}
        <path d={moundPath} fill={`url(#${soilId})`} />
        <ellipse cx="26" cy="130" rx="18" ry="11" fill={`url(#${soilId})`} />
        <ellipse cx="46" cy="135" rx="13" ry="8" fill={`url(#${soilId})`} />
        <ellipse cx="13" cy="140" rx="10" ry="6" fill={`url(#${soilId})`} />
        <ellipse cx="190" cy="130" rx="19" ry="12" fill={`url(#${soilId})`} />
        <ellipse cx="168" cy="136" rx="12" ry="8" fill={`url(#${soilId})`} />
        <ellipse cx="208" cy="140" rx="10" ry="6" fill={`url(#${soilId})`} />
        <ellipse cx="104" cy="67" rx="16" ry="5" fill="#2f1d0d" />

        {/* Flags on all three hills */}
        {flag(52, 60, 20)}
        {flag(138, 60, 20)}
        {flag(104, 62, 28)}
      </svg>
    );
  }

  // Tier 2 (grand fortress): a castle sculpted from dirt — a crenellated keep
  // flanked by two towers, an arched gate, with pennants on every tower.
  const shId = `${idPrefix}-t2sh`;
  const soilId = `${idPrefix}-t2soil`;
  const merlon = (x: number, y: number) => (
    <rect x={x} y={y} width="9" height="9" fill={`url(#${soilId})`} />
  );
  return (
    <svg
      viewBox="0 0 220 150"
      className="pointer-events-none absolute left-1/2 w-[170px] -translate-x-1/2"
      style={{ bottom: 56 }}
      aria-hidden
    >
      <defs>
        <radialGradient id={shId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1c1206" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1c1206" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={soilId} cx="40%" cy="24%" r="95%">
          <stop offset="0%" stopColor="#a84b2a" />
          <stop offset="55%" stopColor="#863a20" />
          <stop offset="100%" stopColor="#57291c" />
        </radialGradient>
      </defs>

      {/* Soft contact shadow */}
      <ellipse cx="112" cy="134" rx="100" ry="16" fill={`url(#${shId})`} />

      {/* Pennant flags — drawn first so they sit behind the castle */}
      <rect x="39.1" y="34" width="1.8" height="23" rx="0.9" fill="#5a3f25" />
      <path d="M40.9 34 L54 39 L40.9 44 Z" fill={accent} />
      <rect x="179.1" y="34" width="1.8" height="23" rx="0.9" fill="#5a3f25" />
      <path d="M180.9 34 L194 39 L180.9 44 Z" fill={accent} />
      <rect x="109.1" y="31" width="1.8" height="24" rx="0.9" fill="#5a3f25" />
      <path d="M110.9 31 L125 36 L110.9 41 Z" fill={accent} />

      {/* Curtain wall, two flanking towers, central keep */}
      <rect x="52" y="86" width="116" height="48" fill={`url(#${soilId})`} />
      <rect x="22" y="58" width="36" height="76" rx="2" fill={`url(#${soilId})`} />
      <rect x="162" y="58" width="36" height="76" rx="2" fill={`url(#${soilId})`} />
      <rect x="86" y="46" width="48" height="88" rx="2" fill={`url(#${soilId})`} />

      {/* Sunlit / shaded sides for a touch of form */}
      <rect x="22" y="58" width="11" height="76" fill="#ffffff" opacity="0.06" />
      <rect x="162" y="58" width="11" height="76" fill="#ffffff" opacity="0.06" />
      <rect x="86" y="46" width="15" height="88" fill="#ffffff" opacity="0.06" />
      <rect x="47" y="58" width="11" height="76" fill="#000000" opacity="0.08" />
      <rect x="187" y="58" width="11" height="76" fill="#000000" opacity="0.08" />
      <rect x="122" y="46" width="12" height="88" fill="#000000" opacity="0.08" />

      {/* Crenellations */}
      {merlon(23, 50)}
      {merlon(36, 50)}
      {merlon(49, 50)}
      {merlon(163, 50)}
      {merlon(176, 50)}
      {merlon(189, 50)}
      {merlon(88, 38)}
      {merlon(100, 38)}
      {merlon(112, 38)}
      {merlon(124, 38)}
      {merlon(60, 78)}
      {merlon(72, 78)}
      {merlon(139, 78)}
      {merlon(151, 78)}

      {/* Windows + arched gate */}
      <rect x="36" y="82" width="8" height="13" rx="3" fill="#2f1d0d" />
      <rect x="176" y="82" width="8" height="13" rx="3" fill="#2f1d0d" />
      <rect x="96" y="64" width="7" height="12" rx="3" fill="#2f1d0d" />
      <rect x="117" y="64" width="7" height="12" rx="3" fill="#2f1d0d" />
      <path d="M99 134 L99 113 Q99 102 110 102 Q121 102 121 113 L121 134 Z" fill="#2f1d0d" />
      <path d="M103 134 L103 116 Q103 109 110 109 Q117 109 117 116 L117 134 Z" fill="#1c1006" />

      {/* Clods + pebbles at the base */}
      <ellipse cx="30" cy="136" rx="16" ry="9" fill={`url(#${soilId})`} />
      <ellipse cx="12" cy="140" rx="9" ry="6" fill={`url(#${soilId})`} />
      <ellipse cx="190" cy="136" rx="16" ry="9" fill={`url(#${soilId})`} />
      <ellipse cx="208" cy="140" rx="9" ry="6" fill={`url(#${soilId})`} />
      <circle cx="70" cy="130" r="3" fill="#caa66f" opacity="0.7" />
      <circle cx="150" cy="131" r="2.5" fill="#b9905a" opacity="0.7" />
    </svg>
  );
});

/* --------------------------------- the plot --------------------------------- */

const TIER_NAME: Record<AntRank, string> = {
  0: "Dirt mound",
  1: "Fortified hill",
  2: "Grand fortress",
};

export default function Anthill({
  topicId,
  topicLabel,
  tier,
  ants,
  active = true,
  generalReady = true,
  recruitUnlocked = true,
  onAntClick,
  onRecruit,
}: {
  topicId: string;
  topicLabel: string;
  tier: AntRank;
  ants: ArmyAntData[];
  /** Whether the scene is on screen; pauses ant roaming/timers when false. */
  active?: boolean;
  /** Whether neighbouring anthills are fortified enough for a warrior here to
   *  reach general; gates the "ready" glow on rank-1 ants. */
  generalReady?: boolean;
  /** Whether this topic's lesson is finished; the recruit button stays locked
   *  until then (button-recruit topics only). */
  recruitUnlocked?: boolean;
  onAntClick: (ant: ArmyAntData) => void;
  onRecruit: () => void;
}) {
  const [ref, width] = useWidth();
  const accent = topicAccent(topicId);
  const cap = anthillCap(topicId);
  const button = isButtonTopic(topicId);
  const hasRoom = ants.length < cap;
  const canRecruit = button && hasRoom && recruitUnlocked;
  const recruitLocked = button && hasRoom && !recruitUnlocked;

  return (
    <div className="group/hill w-full">
      <div ref={ref} className="relative w-full" style={{ height: FIELD_H }}>
        <AnthillMound tier={tier} accent={accent} idPrefix={topicId} />

        {width > 0 &&
          ants.map((ant) => (
            <ArmyAnt
              key={ant.id}
              field={{ w: width, h: FIELD_H }}
              ant={ant}
              active={active}
              eligible={
                isEligible(ant) && !(ant.rank === 1 && !generalReady)
              }
              onClick={() => onAntClick(ant)}
            />
          ))}
      </div>

      {/* Label sits directly below the hill (no card). */}
      <div className="relative z-10 -mt-12 flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.65)]">
          {topicLabel}
        </p>

        {/* Status + recruit reveal only when this hill is hovered/focused. */}
        <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/hill:opacity-100 group-focus-within/hill:opacity-100">
          <p className="text-[11px] font-bold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {ants.length === 0
              ? button
                ? "No ants yet"
                : "Win quiz points to recruit"
              : `${TIER_NAME[tier]} · ${ants.length}/${cap} ants`}
          </p>
          {canRecruit ? (
            <button
              type="button"
              onClick={onRecruit}
              style={{ backgroundColor: accent }}
              className="mt-0.5 min-h-[36px] rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md ring-1 ring-white/40 transition hover:brightness-110 active:scale-95"
            >
              Recruit an ant +
            </button>
          ) : recruitLocked ? (
            <span className="mt-0.5 inline-flex min-h-[36px] items-center rounded-full bg-black/40 px-4 py-1.5 text-[11px] font-bold text-white/90 ring-1 ring-white/25">
              🔒 Finish the lesson to recruit
            </span>
          ) : (
            tier === 2 && (
              <span className="text-[10px] font-bold text-amber-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                ★ Fortress complete
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
