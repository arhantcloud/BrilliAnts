import { describe, it, expect } from "vitest";
import {
  BATTLE_LEVELS,
  ENEMY_SPEED,
  GUARD_SPEED,
  FIRST_SPAWN_MS,
  SPAWN_GAP_MIN_MS,
  SPAWN_GAP_MAX_MS,
  buildSchedule,
  guardHp,
  starsForSurviving,
  strikePower,
  type BattleLevel,
  type LanePick,
} from "./config";
import {
  defeatEnemy,
  initBattle,
  step,
  survivingLanes,
  type BattleState,
} from "./engine";
import type { ArmyAnt, AntRank } from "../types";

/** Build a minimal ArmyAnt of a given rank. */
const ant = (rank: AntRank): ArmyAnt => ({
  id: `a${Math.random()}`,
  rank,
  lastRankChange: "2026-01-01",
  lastRankChangeAt: 0,
  attemptDate: null,
  attemptsUsed: 0,
});

const picks = (ranks: AntRank[][]): LanePick[] =>
  ranks.map((rs, i) => ({ topicId: `l${i + 1}`, ants: rs.map(ant) }));

/** A test level: `perLane` enemies down each chosen lane. */
function testLevel(opts: Partial<BattleLevel> & { perLane: number }): BattleLevel {
  return {
    id: "t",
    name: "Test",
    elitesPerLane: 0,
    ...opts,
  };
}

/** Drive the engine forward in small ticks for `ms`. */
function run(state: BattleState, ms: number, tick = 50): BattleState {
  let s = state;
  for (let t = 0; t < ms; t += tick) s = step(s, tick);
  return s;
}

describe("strikePower / guardHp (training matters)", () => {
  it("sums rank + 1 per ant", () => {
    expect(strikePower([ant(0)])).toBe(1);
    expect(strikePower([ant(2)])).toBe(3);
    expect(strikePower([ant(0), ant(1), ant(2)])).toBe(6);
  });

  it("guardHp is at least 1 so a chosen lane can fight", () => {
    expect(guardHp([])).toBe(1);
    expect(guardHp([ant(2), ant(2)])).toBe(6);
  });
});

describe("starsForSurviving", () => {
  it("maps surviving colonies to stars", () => {
    expect(starsForSurviving(3)).toBe(3);
    expect(starsForSurviving(2)).toBe(2);
    expect(starsForSurviving(1)).toBe(1);
    expect(starsForSurviving(0)).toBe(0);
  });
});

describe("initBattle", () => {
  it("builds one lane per pick with guard HP from its ants", () => {
    const s = initBattle(testLevel({ perLane: 2 }), picks([[2, 2], [0], []]));
    expect(s.lanes).toHaveLength(3);
    expect(s.lanes[0].guardMaxHp).toBe(6);
    expect(s.lanes[1].guardMaxHp).toBe(1);
    expect(s.lanes.every((l) => !l.claimed && !l.reached)).toBe(true);
    expect(s.pending).toHaveLength(6); // 2 per lane x 3 lanes
  });
});

describe("engine.step approach + engage + hits", () => {
  it("spawns, approaches, and engages the guard, then drains its HP", () => {
    // One lane, one weak guard (hp 1), one enemy.
    const s0 = initBattle(testLevel({ perLane: 1 }), picks([[0]]));

    // No enemy yet before the first spawn.
    const beforeSpawn = step(s0, 50);
    expect(beforeSpawn.enemies).toHaveLength(0);

    // Past the first spawn time, the single enemy appears and approaches.
    const spawned = run(s0, FIRST_SPAWN_MS + 1000);
    expect(spawned.enemies).toHaveLength(1);
    expect(spawned.enemies[0].engaged).toBe(false);

    // The enemy and guard close (~11s after spawn), the hp-1 guard then falls
    // (~4s later, ~16s absolute), and the attacker reaches the anthill ~19.5s.
    // At ~18s the guard is defeated but the lane is NOT claimed yet.
    const downNotClaimed = run(s0, 18000);
    expect(downNotClaimed.lanes[0].guardDefeated).toBe(true);
    expect(downNotClaimed.lanes[0].claimed).toBe(false);
    expect(downNotClaimed.status).toBe("playing");

    // Driving further, the attacker reaches the anthill and claims the lane.
    const fallen = run(s0, 40000);
    expect(fallen.lanes[0].claimed).toBe(true);
    expect(fallen.status).toBe("lost");
  });

  it("does not mutate the input state", () => {
    const s0 = initBattle(testLevel({ perLane: 1 }), picks([[1]]));
    step(s0, 500);
    expect(s0.enemies).toHaveLength(0);
    expect(s0.elapsedMs).toBe(0);
  });

  it("never lets two enemies share a lane (one spawns only when its lane is clear)", () => {
    // 3 enemies per lane across 3 lanes; nobody is ever defeated, so each
    // lane's first enemy engages and blocks the rest from spawning.
    let s = initBattle(testLevel({ perLane: 3 }), picks([[2], [2], [2]]));
    for (let t = 0; t < 60000; t += 200) {
      s = step(s, 200);
      const perLane = new Map<string, number>();
      for (const e of s.enemies) {
        perLane.set(e.laneId, (perLane.get(e.laneId) ?? 0) + 1);
      }
      for (const n of perLane.values()) expect(n).toBeLessThanOrEqual(1);
    }
    // Only 3 ever made it onto the field (one per lane); the rest still wait.
    expect(s.enemies.length).toBeLessThanOrEqual(3);
    expect(s.pending.length).toBeGreaterThan(0);
  });
});

describe("victory: a clear lane lets the guard reach the enemy base", () => {
  it("advances an unobstructed guard and wins on breakthrough", () => {
    // A lane with no enemies: the guard just marches to the base.
    const noEnemies = testLevel({ perLane: 0 });
    const s0 = initBattle(noEnemies, picks([[2, 2, 2]]));
    expect(s0.pending).toHaveLength(0);
    // Guard speed is ENEMY_SPEED/3 (~0.0000213/ms), so an uncontested guard
    // crosses ~0.92 in ~43s; drive well past that.
    const won = run(s0, 110000, 100);
    expect(won.lanes[0].reached).toBe(true);
    expect(won.status).toBe("won");
  });
});

describe("defeatEnemy", () => {
  it("removes the targeted enemy (a correct answer)", () => {
    const s = run(initBattle(testLevel({ perLane: 1 }), picks([[1]])), FIRST_SPAWN_MS + 1000);
    const id = s.enemies[0].id;
    const after = defeatEnemy(s, id);
    expect(after.enemies.some((e) => e.id === id)).toBe(false);
  });

  it("no-ops for unknown ids", () => {
    const s = run(initBattle(testLevel({ perLane: 1 }), picks([[1]])), FIRST_SPAWN_MS + 1000);
    expect(defeatEnemy(s, "nope")).toBe(s);
  });
});

describe("survivingLanes", () => {
  it("counts lanes whose guard still stands", () => {
    const s = initBattle(testLevel({ perLane: 0 }), picks([[1], [1], [1]]));
    expect(survivingLanes(s)).toBe(3);
    const claimed: BattleState = {
      ...s,
      lanes: s.lanes.map((l, i) => (i === 0 ? { ...l, claimed: true } : l)),
    };
    expect(survivingLanes(claimed)).toBe(2);
  });
});

describe("BATTLE_LEVELS config", () => {
  it("declares the three campaign levels with the exact ids", () => {
    expect(BATTLE_LEVELS.map((l) => l.id)).toEqual([
      "battle-1",
      "battle-2",
      "battle-3",
    ]);
  });

  it("staggers and interleaves perLane enemies for each chosen lane", () => {
    const lanes = picks([[1], [1], [1]]);
    // Fixed mid-point rand -> a deterministic, positive gap.
    const gap = SPAWN_GAP_MIN_MS + 0.5 * (SPAWN_GAP_MAX_MS - SPAWN_GAP_MIN_MS);
    for (const level of BATTLE_LEVELS) {
      const sched = buildSchedule(level, lanes, () => 0.5);
      expect(sched).toHaveLength(level.perLane * lanes.length);

      const times = sched.map((e) => e.spawnAtMs);
      // Strictly increasing.
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
      }
      // First spawn is FIRST_SPAWN_MS; gap to the next is the staggered gap.
      expect(times[0]).toBe(FIRST_SPAWN_MS);
      if (times.length > 1) {
        expect(times[1] - times[0]).toBe(gap);
      }
      // Unique ids.
      expect(new Set(sched.map((e) => e.id)).size).toBe(sched.length);
      // Consecutive spawns alternate lanes: the first three are 3 lanes.
      if (level.perLane > 0) {
        const firstThree = sched.slice(0, 3).map((e) => e.laneIndex);
        expect(new Set(firstThree).size).toBe(3);
      }
    }
  });

  it("makes the later levels send elites", () => {
    const lanes = picks([[1], [1], [1]]);
    expect(
      buildSchedule(BATTLE_LEVELS[0], lanes, () => 0).some((e) => e.elite),
    ).toBe(false);
    expect(
      buildSchedule(BATTLE_LEVELS[2], lanes, () => 0).filter((e) => e.elite)
        .length,
    ).toBeGreaterThan(0);
  });

  it("makes the guard advance at one sixth of the enemy approach speed", () => {
    expect(ENEMY_SPEED).toBe(0.000064);
    expect(GUARD_SPEED).toBeCloseTo(ENEMY_SPEED / 6, 12);
  });
});
