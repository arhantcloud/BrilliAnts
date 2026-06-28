/**
 * Course rank badges, earned from how far the Ant Army base has been upgraded.
 *
 * Each anthill contributes "stars" equal to its tier: a fortified hill (tier 1)
 * is 1★ and a grand fortress (tier 2) is 2★, so the six anthills yield 0–12★.
 * Because a hill can only reach tier 2 after tier 1, the total is monotonic and
 * the badge ladder below is strictly increasing — earning a higher badge always
 * implies every lower one is already achieved.
 */

import type { AntRank } from "../types";
import { ARMY_TOPIC_IDS } from "./config";

export type Badge = {
  id: string;
  label: string;
  /** Minimum army stars (sum of anthill tiers) required to earn this badge. */
  minStars: number;
  /** Emoji emblem. */
  glyph: string;
  /** Accent colour for the emblem ring. */
  color: string;
  /** Short requirement description shown in the badge list. */
  blurb: string;
};

/** The maximum possible army strength: 6 anthills × tier 2. */
export const MAX_STARS = ARMY_TOPIC_IDS.length * 2;

/** Ascending ladder of badges (each `minStars` strictly greater than the last). */
export const BADGES: Badge[] = [
  {
    id: "recruit",
    label: "Recruit",
    minStars: 0,
    glyph: "🐜",
    color: "#ad9588", // umber-300
    blurb: "Begin building your ant army.",
  },
  {
    id: "scout",
    label: "Scout",
    minStars: 1,
    glyph: "🔰",
    color: "#d27c4f", // brand-400
    blurb: "Fortify your first anthill (1★).",
  },
  {
    id: "forager",
    label: "Forager",
    minStars: 3,
    glyph: "🍃",
    color: "#c05f33", // brand-500
    blurb: "Reach 3 army stars.",
  },
  {
    id: "soldier",
    label: "Soldier",
    minStars: 6,
    glyph: "🛡️",
    color: "#a44a26", // brand-600
    blurb: "Fortify every anthill (6★).",
  },
  {
    id: "sentinel",
    label: "Sentinel",
    minStars: 8,
    glyph: "⚔️",
    color: "#863a20", // brand-700
    blurb: "Reach 8 army stars.",
  },
  {
    id: "captain",
    label: "Captain",
    minStars: 10,
    glyph: "🎖️",
    color: "#4e342b", // umber-700 (espresso accent)
    blurb: "Reach 10 army stars.",
  },
  {
    id: "warlord",
    label: "Warlord",
    minStars: MAX_STARS,
    glyph: "👑",
    color: "#c2912f", // warm gold crown
    blurb: "Raise every anthill to a fortress (12★) and score 100% on the final exam.",
  },
];

/** Index of the top badge (Warlord), which has the extra final-exam gate. */
export const WARLORD_INDEX = BADGES.length - 1;

/** Total army stars = sum of every anthill's tier. */
export function armyStars(anthillTier: (topicId: string) => AntRank): number {
  return ARMY_TOPIC_IDS.reduce((sum, id) => sum + anthillTier(id), 0);
}

/**
 * Index of the highest badge earned at the given star total. The top badge
 * (Warlord) additionally requires a perfect final exam; without it, the rank is
 * capped one below, no matter how many army stars are earned.
 */
export function currentBadgeIndex(stars: number, finalPerfect = true): number {
  let idx = 0;
  for (let i = 0; i < BADGES.length; i++) {
    if (stars >= BADGES[i].minStars) idx = i;
  }
  if (idx === WARLORD_INDEX && !finalPerfect) idx = WARLORD_INDEX - 1;
  return idx;
}
