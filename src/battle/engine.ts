/**
 * Pure, DOM-free Battle engine for the three-lane guard tug-of-war. All state
 * transitions are plain functions over a {@link BattleState} so they can be
 * unit-tested without React. The React layer (useBattleEngine) drives `step`
 * from requestAnimationFrame and `defeatEnemy` from correct answers.
 *
 * Geometry: progress runs 0 (player anthills, left) -> 1 (enemy base, right).
 * Guards start near 0 and advance toward 1 only when no enemy is engaged with
 * them. Enemies start near 1 and approach their lane's guard, stopping just in
 * front to attack. A guard reaching 1 wins; losing every lane loses.
 */

import type { AntRank } from "../types";
import type { BattleLevel, EnemySpec, LanePick } from "./config";
import {
  ANTHILL_POS,
  ELITE_HIT,
  ENEMY_SPEED,
  ENEMY_START,
  ENGAGE_GAP,
  GUARD_SPEED,
  GUARD_START,
  HIT_INTERVAL_MS,
  NORMAL_HIT,
  buildSchedule,
  guardHp,
  guardRank,
  laneTier,
} from "./config";

export type Lane = {
  /** Lane id == the chosen anthill's topic id. */
  id: string;
  topicId: string;
  guardMaxHp: number;
  guardHp: number;
  /** 0 at the anthill (left), 1 at the enemy base (right). */
  guardPos: number;
  /** Highest rank in the anthill (guard sprite). */
  rank: AntRank;
  /** Anthill visual tier. */
  tier: AntRank;
  /** Guard's HP hit zero: it's removed and the lane is now unprotected. */
  guardDefeated: boolean;
  /** An enemy reached the (unprotected) anthill and claimed the colony. */
  claimed: boolean;
  /** Guard reached the enemy base. */
  reached: boolean;
};

export type LiveEnemy = {
  id: string;
  laneId: string;
  topicId: string;
  elite: boolean;
  /** 1 at the enemy base; decreases as it approaches the guard. */
  pos: number;
  /** Reached the guard and is now attacking. */
  engaged: boolean;
  hitTimerMs: number;
};

export type BattleStatus = "playing" | "won" | "lost";

export type BattleState = {
  levelId: string;
  elapsedMs: number;
  lanes: Lane[];
  enemies: LiveEnemy[];
  /** Enemies still waiting for their spawn time. */
  pending: EnemySpec[];
  status: BattleStatus;
};

/** Build the initial state for a level and the three chosen anthills. */
export function initBattle(level: BattleLevel, picks: LanePick[]): BattleState {
  const lanes: Lane[] = picks.map((p) => {
    const hp = guardHp(p.ants);
    return {
      id: p.topicId,
      topicId: p.topicId,
      guardMaxHp: hp,
      guardHp: hp,
      guardPos: GUARD_START,
      rank: guardRank(p.ants),
      tier: laneTier(p.topicId, p.ants),
      guardDefeated: false,
      claimed: false,
      reached: false,
    };
  });
  return {
    levelId: level.id,
    elapsedMs: 0,
    lanes,
    enemies: [],
    pending: buildSchedule(level, picks),
    status: "playing",
  };
}

/** How many lanes still have a standing guard. */
export function survivingLanes(state: BattleState): number {
  return state.lanes.filter((l) => !l.claimed).length;
}

function resolveStatus(lanes: Lane[]): BattleStatus {
  if (lanes.some((l) => l.reached)) return "won";
  if (lanes.length > 0 && lanes.every((l) => l.claimed)) return "lost";
  return "playing";
}

/**
 * Advance the battle by `dtMs`: spawn due enemies, approach + engage guards,
 * accrue hits and claim fallen lanes, then march unobstructed guards toward the
 * enemy base, and resolve win/lose. Returns a new state; never mutates input.
 */
export function step(state: BattleState, dtMs: number): BattleState {
  if (state.status !== "playing" || dtMs <= 0) return state;
  const elapsedMs = state.elapsedMs + dtMs;

  const lanes = state.lanes.map((l) => ({ ...l }));
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));

  // 1) Spawn due enemies, but only ONE per lane at a time: a lane already
  //    holding a live enemy (or that's been claimed) defers its next spawn
  //    until the lane is clear. Pending stays time-ordered, so a lane's
  //    earliest waiting enemy is the one that spawns once it frees up.
  const occupied = new Set<number>();
  for (const e of state.enemies) {
    const li = laneIndex.get(e.laneId);
    if (li !== undefined) occupied.add(li);
  }
  const stillPending: EnemySpec[] = [];
  const working: LiveEnemy[] = state.enemies.map((e) => ({ ...e }));
  for (const p of state.pending) {
    const lane = lanes[p.laneIndex];
    if (!lane || lane.claimed) continue; // drop spawns for dead/claimed lanes
    if (p.spawnAtMs <= elapsedMs && !occupied.has(p.laneIndex)) {
      working.push({
        id: p.id,
        laneId: lane.id,
        topicId: p.topicId,
        elite: p.elite,
        pos: ENEMY_START,
        engaged: false,
        hitTimerMs: 0,
      });
      occupied.add(p.laneIndex);
    } else {
      stillPending.push(p);
    }
  }

  // 2) Move enemies. While a guard stands, attackers stop at it and chip its
  //    HP. Once the guard is down the lane is unprotected, so attackers march
  //    on to the anthill — reaching it claims the colony.
  const damage = new Array(lanes.length).fill(0);
  const advanced: LiveEnemy[] = [];
  for (const e of working) {
    const li = laneIndex.get(e.laneId);
    if (li === undefined || lanes[li].claimed) continue; // drop
    const lane = lanes[li];
    let { pos, engaged, hitTimerMs } = e;
    if (!lane.guardDefeated) {
      const stopAt = lane.guardPos + ENGAGE_GAP;
      if (!engaged) {
        pos -= ENEMY_SPEED * dtMs;
        if (pos <= stopAt) {
          pos = stopAt;
          engaged = true;
        }
      } else {
        pos = stopAt; // stay stationed just ahead of the guard
        hitTimerMs += dtMs;
        while (hitTimerMs >= HIT_INTERVAL_MS) {
          damage[li] += e.elite ? ELITE_HIT : NORMAL_HIT;
          hitTimerMs -= HIT_INTERVAL_MS;
        }
      }
    } else {
      // Guard is down: push on toward the anthill to claim it.
      engaged = false;
      pos -= ENEMY_SPEED * dtMs;
      if (pos <= ANTHILL_POS) {
        pos = ANTHILL_POS;
        lanes[li].claimed = true;
      }
    }
    advanced.push({ ...e, pos, engaged, hitTimerMs });
  }

  // 3) Apply damage; a guard whose HP hits zero is defeated (lane unprotected,
  //    but NOT yet claimed — an enemy must still reach the anthill).
  for (let i = 0; i < lanes.length; i++) {
    if (damage[i] > 0 && !lanes[i].guardDefeated && !lanes[i].claimed) {
      lanes[i].guardHp = Math.max(0, lanes[i].guardHp - damage[i]);
      if (lanes[i].guardHp <= 0) lanes[i].guardDefeated = true;
    }
  }

  // 4) Drop enemies on lanes that just got claimed.
  const survivors = advanced.filter((e) => {
    const li = laneIndex.get(e.laneId);
    return li !== undefined && !lanes[li].claimed;
  });

  // 5) March unobstructed, still-guarded lanes toward the enemy base.
  const engagedLane = new Array(lanes.length).fill(false);
  for (const e of survivors) {
    if (e.engaged) {
      const li = laneIndex.get(e.laneId);
      if (li !== undefined) engagedLane[li] = true;
    }
  }
  for (let i = 0; i < lanes.length; i++) {
    const lane = lanes[i];
    if (lane.claimed || lane.guardDefeated || engagedLane[i]) continue;
    lane.guardPos = Math.min(1, lane.guardPos + GUARD_SPEED * dtMs);
    if (lane.guardPos >= 1) lane.reached = true;
  }

  return {
    ...state,
    elapsedMs,
    lanes,
    enemies: survivors,
    pending: stillPending,
    status: resolveStatus(lanes),
  };
}

/**
 * Remove one enemy (a correct answer defeats it). No-ops if the battle is over
 * or the id is gone. Clearing a lane's attackers lets its guard resume marching
 * on the next `step`.
 */
export function defeatEnemy(state: BattleState, enemyId: string): BattleState {
  if (state.status !== "playing") return state;
  if (!state.enemies.some((e) => e.id === enemyId)) return state;
  return { ...state, enemies: state.enemies.filter((e) => e.id !== enemyId) };
}
