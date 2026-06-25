import { createContext, useContext } from "react";
import type {
  LessonStatus,
  ProgressMap,
  QuizResult,
  QuizResultMap,
  QuizStatus,
  UserStats,
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
  /** Record a quiz attempt; keeps the best score, bumps attempts/streak, persists. */
  recordQuizAttempt: (lessonId: string, correct: number, total: number) => void;
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
