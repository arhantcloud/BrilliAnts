/**
 * Pure helpers describing an ant's upgrade eligibility and the countdown-ring
 * progress. Shared by the ProgressContext mutators and the army UI so the gate
 * rules live in exactly one place.
 */

import type { ArmyAnt } from "../types";
import { todayStr } from "./dates";

/** Highest rank an ant can reach (general). */
export const MAX_RANK = 2;

/** Upgrade attempts allowed per ant on an eligible day. */
export const ATTEMPTS_PER_DAY = 2;

/** The wait before an ant can be upgraded again: one full day. */
export const UPGRADE_WAIT_MS = 24 * 60 * 60 * 1000;

/** Attempts already spent today (resets when the stored day is not today). */
export function attemptsUsedToday(ant: ArmyAnt, today = todayStr()): number {
  return ant.attemptDate === today ? ant.attemptsUsed : 0;
}

/** Attempts the ant has left today. */
export function attemptsLeft(ant: ArmyAnt, today = todayStr()): number {
  return Math.max(0, ATTEMPTS_PER_DAY - attemptsUsedToday(ant, today));
}

/** True once the upgrade wait has elapsed since recruit/last promotion. */
export function dayHasPassed(ant: ArmyAnt, now = Date.now()): boolean {
  return now >= eligibleAtMs(ant);
}

/** True when the ant can be upgraded right now. */
export function isEligible(ant: ArmyAnt, now = Date.now()): boolean {
  return ant.rank < MAX_RANK && dayHasPassed(ant, now) && attemptsLeft(ant) > 0;
}

/** ms timestamp when the ant first becomes eligible (wait elapsed). */
export function eligibleAtMs(ant: ArmyAnt): number {
  return ant.lastRankChangeAt + UPGRADE_WAIT_MS;
}

/**
 * Fraction (0..1) of the wait elapsed toward eligibility, for the countdown
 * ring: 0 just after a promotion, 1 once the ant is eligible.
 */
export function ringProgress(ant: ArmyAnt, now: number): number {
  const target = eligibleAtMs(ant);
  const span = target - ant.lastRankChangeAt;
  if (span <= 0) return 1;
  const elapsed = now - ant.lastRankChangeAt;
  if (elapsed <= 0) return 0;
  if (elapsed >= span) return 1;
  return elapsed / span;
}
