import { createContext, useContext } from "react";
import type {
  AntArmyMap,
  AntRank,
  BattleProgressMap,
  LessonStatus,
  MistakeMap,
  ProgressMap,
  QuizResult,
  QuizResultMap,
  QuizStatus,
  UserStats,
  WrongQuestion,
} from "../types";

/** Minimum best-score percentage required to pass a quiz and unlock the next lesson. */
export const PASS_THRESHOLD = 60;

export type ProgressContextValue = {
  loading: boolean;
  progress: ProgressMap;
  quizzes: QuizResultMap;
  stats: UserStats;
  lessonStatus: (lessonId: string) => LessonStatus;
  resumeIndex: (lessonId: string) => number;
  /** Mark a slide complete; advances resume point and handles lesson completion. */
  completeSlide: (
    lessonId: string,
    slideIndex: number,
    totalSlides: number,
  ) => void;
  /** Best persisted quiz result for a lesson, if the learner has attempted it. */
  quizResult: (lessonId: string) => QuizResult | undefined;
  /**
   * Status of a lesson's quiz:
   *  - "locked": the lesson is not yet completed.
   *  - "passed": attempted with best% >= PASS_THRESHOLD.
   *  - "failed": attempted but best% < PASS_THRESHOLD.
   *  - "available": lesson completed but quiz not yet attempted.
   */
  quizStatus: (lessonId: string) => QuizStatus;
  /**
   * Record a quiz attempt; keeps the best score, bumps attempts/streak, persists.
   * On a NEW high score, the lesson's stored mistakes (ants) are replaced by the
   * attempt's `wrong` questions; otherwise existing mistakes are kept.
   */
  recordQuizAttempt: (
    lessonId: string,
    correct: number,
    total: number,
    wrong?: WrongQuestion[],
  ) => void;
  /** Outstanding mistakes (ants) per lesson, shown in the Ant Colony. */
  mistakes: MistakeMap;
  /** Number of outstanding mistakes (ants) for a lesson. */
  mistakeCount: (lessonId: string) => number;
  /** Total outstanding mistakes (ants) across all lessons. */
  totalMistakes: number;
  /**
   * Clear one mistake (ant leaves the colony): removes it and recovers one quiz
   * point for that lesson (best score +1, capped at the quiz length).
   */
  resolveMistake: (lessonId: string, mistakeId: string) => void;
  /** Ants stationed at each topic's anthill in the Ant Army base. */
  antArmy: AntArmyMap;
  /**
   * The anthill's visual tier = the lowest rank among its ants (0 if empty).
   * The hill upgrades once every ant reaches warrior, then again at general.
   */
  anthillTier: (topicId: string) => AntRank;
  /** Recruit one worker into a button topic's anthill (caller gates on a correct answer). */
  recruitAnt: (topicId: string) => void;
  /**
   * Apply one upgrade attempt to an ant. `bothCorrect` promotes it one rank and
   * starts a fresh one-day wait; otherwise it spends one of the day's attempts.
   * Re-checks eligibility, so a stale UI cannot over-spend attempts.
   */
  attemptAntUpgrade: (
    topicId: string,
    antId: string,
    bothCorrect: boolean,
  ) => void;
  /**
   * TESTING ONLY: mutate a single ant, bypassing the wait/attempt gates.
   *  - "ready": make it immediately eligible to upgrade.
   *  - "upgrade": promote it one rank right now.
   */
  devMutateAnt: (
    topicId: string,
    antId: string,
    mode: "ready" | "upgrade",
  ) => void;
  /** Best result per Battle campaign level. */
  battleProgress: BattleProgressMap;
  /**
   * Record a Battle level outcome; keeps the best stars (and best remaining-HP
   * tiebreak), stamps clearedAt, and persists.
   */
  recordBattleResult: (
    levelId: string,
    stars: 0 | 1 | 2 | 3,
    remainingHpPct: number,
  ) => void;
  /** Whether Battle mode is unlocked (the final exam has been passed). */
  battleUnlocked: boolean;
  completedCount: number;
  totalLessons: number;
  /** Sum of best correct answers across all lesson quizzes. */
  quizPointsEarned: number;
  /** Maximum possible quiz points (5 per lesson). */
  quizPointsTotal: number;
};

export const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined,
);

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
