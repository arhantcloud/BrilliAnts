/**
 * Per-rank colours, labels, and badge glyphs for Ant Army ants. Each rank has a
 * distinct body colour (passed into AntSvg) and a small SVG badge pinned to the
 * ant and reused in the legend and countdown ring.
 */

import type { AntRank } from "../types";

export type RankVisual = {
  rank: AntRank;
  label: string;
  /** AntSvg body colour. */
  body: string;
  /** AntSvg dark body / limb colour. */
  bodyDark: string;
  /** Badge disc fill. */
  badgeFill: string;
  /** Badge glyph / outline colour. */
  badgeInk: string;
};

export const RANK_VISUALS: Record<AntRank, RankVisual> = {
  0: {
    rank: 0,
    label: "Worker",
    body: "#a44a26",
    bodyDark: "#57291c",
    badgeFill: "#b07a3c",
    badgeInk: "#3a2412",
  },
  1: {
    rank: 1,
    label: "Warrior",
    body: "#b23b3b",
    bodyDark: "#6e1f1f",
    badgeFill: "#9aa7b4",
    badgeInk: "#28323d",
  },
  2: {
    rank: 2,
    label: "General",
    body: "#c9a227",
    bodyDark: "#7a5c10",
    badgeFill: "#f5c542",
    badgeInk: "#6b4e07",
  },
};

export function rankLabel(rank: AntRank): string {
  return RANK_VISUALS[rank].label;
}

/** The glyph inside a rank badge (spade / crossed swords / star + crown). */
export function RankGlyph({ rank, color }: { rank: AntRank; color: string }) {
  if (rank === 0) {
    // Worker: a spade / shovel digging tool.
    return (
      <path
        d="M12 4c-2.6 2.4-4 4.4-4 6.2A4 4 0 0012 14a4 4 0 004-3.8c0-1.8-1.4-3.8-4-6.2zM11 14h2v4h-2z"
        fill={color}
      />
    );
  }
  if (rank === 1) {
    // Warrior: crossed swords.
    return (
      <g
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M6 5l9 9" />
        <path d="M18 5l-9 9" />
        <path d="M5 16l3 3M19 16l-3 3" />
      </g>
    );
  }
  // General: a five-point star.
  return (
    <path
      d="M12 4l2.2 4.6 5 .7-3.6 3.5.9 5L12 15.9 7.5 17.8l.9-5L4.8 9.3l5-.7z"
      fill={color}
    />
  );
}

/**
 * A circular rank badge: a coloured disc with the rank glyph. Used pinned on an
 * ant, in the legend, and at the centre of the countdown ring.
 */
export function RankBadge({
  rank,
  size = 18,
  className,
}: {
  rank: AntRank;
  size?: number;
  className?: string;
}) {
  const v = RANK_VISUALS[rank];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${v.label} badge`}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill={v.badgeFill}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <RankGlyph rank={rank} color={v.badgeInk} />
    </svg>
  );
}
