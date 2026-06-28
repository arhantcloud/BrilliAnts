/**
 * Static configuration for Battle mode: the campaign levels, their per-lane
 * spawn cadence, the movement/combat constants, and the pure scoring helpers.
 *
 * Battle is a three-lane tug-of-war. The player fields THREE of their anthills;
 * each mans a lane with a guard ant (its highest rank, standing on its tiered
 * hill). Enemies march out of a single enemy base on the right and stop at each
 * guard. Tapping an enemy poses that lane's topic question; a correct answer
 * defeats it. While a guard has no enemy on it, it advances toward the enemy
 * base. A guard reaching the enemy base wins; losing every lane loses; stars
 * equal the number of colonies still standing at the breakthrough.
 */

import type { AntRank, ArmyAnt } from "../types";
import {
  ARMY_TOPIC_IDS,
  computeAnthillTier,
  upgradeTemplateId,
} from "../army/config";

/** A single scheduled enemy spawn for a lane. */
export type EnemySpec = {
  id: string;
  /** Index into the chosen lanes (0-2). */
  laneIndex: number;
  topicId: string;
  /** Elites ask the harder upgrade question and hit twice as hard. */
  elite: boolean;
  spawnAtMs: number;
};

/** A Battle campaign level: how many enemies each lane sends, and how fast. */
export type BattleLevel = {
  id: string;
  name: string;
  /** Enemies sent down EACH lane. */
  perLane: number;
  /** How many of each lane's enemies (the last ones) are elites. */
  elitesPerLane: number;
};

/** One chosen anthill that mans a lane (its real ants drive the guard). */
export type LanePick = {
  topicId: string;
  ants: ArmyAnt[];
};

/* ------------------------------- geometry -------------------------------- */

/** Guard start (just in front of its anthill, left edge). */
export const GUARD_START = 0.08;
/** Enemy start (just in front of the enemy base, right edge). */
export const ENEMY_START = 0.92;
/** Enemy approach speed (progress per ms). */
export const ENEMY_SPEED = 0.000064;
/** Guard advance speed (progress per ms): one sixth of the enemy approach speed. */
export const GUARD_SPEED = ENEMY_SPEED / 6;
/**
 * Once a guard is defeated its lane is unprotected; an enemy must march all the
 * way to the anthill (this progress, the left edge) to actually claim it.
 */
export const ANTHILL_POS = 0.02;

/** When the first enemy of the battle spawns (ms). */
export const FIRST_SPAWN_MS = 1500;
/** Minimum gap between successive staggered spawns (ms). */
export const SPAWN_GAP_MIN_MS = 0;
/** Maximum gap between successive staggered spawns (ms). */
export const SPAWN_GAP_MAX_MS = 20000;
/** An enemy stops this far in front of the guard to fight it. */
export const ENGAGE_GAP = 0.05;
/** Each engaged enemy lands a hit on the guard this often (ms). */
export const HIT_INTERVAL_MS = 4000;
/** Damage a single hit deals to a guard. */
export const NORMAL_HIT = 1;
export const ELITE_HIT = 2;

/* ------------------------------ templates -------------------------------- */

const LESSON_TEMPLATES: Record<string, string> = {
  "l1-two-questions": "classify",
  "l2-perm-no-rep": "permutation",
  "l3-order-rep": "sequence",
  "l4-comb-no-rep": "combination",
  "l5-choice-distribution": "multiset",
  "l6-choose-distribute": "distribute",
};

/** The lesson quiz template id a normal enemy of `topicId` asks. */
export function lessonTemplateFor(topicId: string): string | null {
  return LESSON_TEMPLATES[topicId] ?? null;
}

/** The (harder) upgrade-challenge template id an elite of `topicId` asks. */
export function eliteTemplateFor(topicId: string): string | null {
  return upgradeTemplateId(topicId, 1);
}

/* ----------------------------- guard strength ---------------------------- */

/**
 * A topic's army strength: each ant contributes `rank + 1` (worker 1, warrior
 * 2, general 3). Used as the guard ant's HP — a better-trained anthill fields a
 * tougher guard that withstands more unanswered hits.
 */
export function strikePower(
  ants: ReadonlyArray<Pick<ArmyAnt, "rank">> | undefined,
): number {
  if (!ants || ants.length === 0) return 0;
  return ants.reduce((sum, a) => sum + a.rank + 1, 0);
}

/** The guard ant's HP for an anthill (at least 1 so a chosen lane can fight). */
export function guardHp(ants: ArmyAnt[]): number {
  return Math.max(1, strikePower(ants));
}

/** The highest rank among an anthill's ants (0 if empty) — the guard's look. */
export function guardRank(ants: ArmyAnt[]): AntRank {
  return ants.reduce<AntRank>((m, a) => (a.rank > m ? a.rank : m), 0);
}

/** An anthill's visual tier for its hill graphic. */
export function laneTier(topicId: string, ants: ArmyAnt[]): AntRank {
  return computeAnthillTier(ants, topicId);
}

/**
 * Stars earned from how many colonies (lanes) are still standing when a guard
 * breaks through: 3 lanes -> 3 stars, 2 -> 2, 1 -> 1. A loss earns 0.
 */
export function starsForSurviving(surviving: number): 0 | 1 | 2 | 3 {
  if (surviving <= 0) return 0;
  if (surviving >= 3) return 3;
  return surviving as 1 | 2;
}

/**
 * Expand a level + chosen lanes into a flat, time-sorted spawn schedule.
 *
 * Lanes are interleaved round-robin so consecutive spawns alternate lanes
 * (never all lanes at once), and each spawn is staggered after the previous by
 * a random 20-40s gap starting at {@link FIRST_SPAWN_MS}.
 */
export function buildSchedule(
  level: BattleLevel,
  lanes: LanePick[],
  rand: () => number = Math.random,
): EnemySpec[] {
  const out: EnemySpec[] = [];
  let t = FIRST_SPAWN_MS;
  for (let i = 0; i < level.perLane; i++) {
    const elite = i >= level.perLane - level.elitesPerLane;
    for (let L = 0; L < lanes.length; L++) {
      out.push({
        id: `${level.id}-l${L}-e${i}`,
        laneIndex: L,
        topicId: lanes[L].topicId,
        elite,
        spawnAtMs: t,
      });
      t += SPAWN_GAP_MIN_MS + rand() * (SPAWN_GAP_MAX_MS - SPAWN_GAP_MIN_MS);
    }
  }
  return out;
}

/** The three campaign levels, in unlock order. */
export const BATTLE_LEVELS: BattleLevel[] = [
  {
    id: "battle-1",
    name: "Skirmish at the Anthill",
    perLane: 4,
    elitesPerLane: 0,
  },
  {
    id: "battle-2",
    name: "Raid on the Ridge",
    perLane: 4,
    elitesPerLane: 1,
  },
  {
    id: "battle-3",
    name: "Siege of the Six Hills",
    perLane: 5,
    elitesPerLane: 1,
  },
];

/** Look up a campaign level by id. */
export function getBattleLevel(levelId: string): BattleLevel | undefined {
  return BATTLE_LEVELS.find((l) => l.id === levelId);
}

/** The six army topics, re-exported for convenience. */
export const BATTLE_TOPIC_IDS = ARMY_TOPIC_IDS;

export type { AntRank };
