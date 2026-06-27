import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/auth-context";
import { course } from "../content/course";
import { FINAL_QUIZ_ID, getLessonQuiz } from "../content/quizzes";
import { emptyStats, loadUserData, saveUserData } from "../data/persistence";
import type {
  LessonProgress,
  LessonStatus,
  Mistake,
  MistakeMap,
  ProgressMap,
  QuizResult,
  QuizResultMap,
  QuizStatus,
  UserStats,
  WrongQuestion,
} from "../types";
import {
  PASS_THRESHOLD,
  ProgressContext,
  type ProgressContextValue,
} from "./progress-context";

/** Dev account: every lesson and quiz is unlocked regardless of progress. */
const DEV_EMAIL = "ghdv@gmail.com";

function todayStr(): string {
  // Local calendar date (yyyy-mm-dd) so the streak follows the user's day, not UTC.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function bumpStreak(stats: UserStats): UserStats {
  const today = todayStr();
  if (stats.lastActiveDate === today) return stats;
  let streak = 1;
  if (stats.lastActiveDate) {
    const gap = daysBetween(stats.lastActiveDate, today);
    if (gap === 1) streak = stats.currentStreak + 1;
  }
  return { ...stats, currentStreak: streak, lastActiveDate: today };
}

/** Best-score percentage (0-100) for a quiz result, or 0 when unattempted. */
function bestPercent(result: QuizResult | undefined): number {
  if (!result || result.total <= 0) return 0;
  return (result.bestCorrect / result.total) * 100;
}

/** Build a stored Mistake (ant) from a captured wrong question. */
function makeMistake(
  lessonId: string,
  wrong: WrongQuestion,
  index: number,
): Mistake {
  const mistake: Mistake = {
    id: `${lessonId}:${Date.now()}:${index}:${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    lessonId,
    templateId: wrong.templateId,
    createdAt: Date.now(),
  };
  // Avoid writing `undefined` (Firestore rejects undefined field values).
  if (wrong.style !== undefined) mistake.style = wrong.style;
  if (wrong.params !== undefined) mistake.params = wrong.params;
  if (wrong.answer !== undefined) mistake.answer = wrong.answer;
  return mistake;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const devMode = user?.email?.trim().toLowerCase() === DEV_EMAIL;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [quizzes, setQuizzes] = useState<QuizResultMap>({});
  const [stats, setStats] = useState<UserStats>({ ...emptyStats });
  const [mistakes, setMistakes] = useState<MistakeMap>({});
  const uidRef = useRef<string | null>(null);

  // Mirror the latest state so persist() can always write a consistent, full
  // snapshot even when only one slice changed.
  const progressRef = useRef<ProgressMap>(progress);
  const quizzesRef = useRef<QuizResultMap>(quizzes);
  const statsRef = useRef<UserStats>(stats);
  const mistakesRef = useRef<MistakeMap>(mistakes);
  // Keep the mirrors in sync after each commit so persist() can always read the
  // latest full snapshot. (Done in an effect, not during render, so we never
  // mutate a ref while rendering.)
  useEffect(() => {
    progressRef.current = progress;
    quizzesRef.current = quizzes;
    statsRef.current = stats;
    mistakesRef.current = mistakes;
  }, [progress, quizzes, stats, mistakes]);

  useEffect(() => {
    let active = true;
    uidRef.current = user?.uid ?? null;
    // Treat "no user" as an immediately-resolved empty load so that every
    // state update happens inside the async callback (never synchronously in
    // the effect body).
    const load = user
      ? loadUserData(user.uid)
      : Promise.resolve({
          progress: {} as ProgressMap,
          quizzes: {} as QuizResultMap,
          stats: { ...emptyStats },
          mistakes: {} as MistakeMap,
        });
    load.then((data) => {
      if (!active) return;
      setProgress(data.progress);
      setQuizzes(data.quizzes);
      setStats(data.stats);
      setMistakes(data.mistakes);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const persist = useCallback(
    (
      nextProgress: ProgressMap,
      nextQuizzes: QuizResultMap,
      nextStats: UserStats,
      nextMistakes: MistakeMap,
    ) => {
      const uid = uidRef.current;
      if (!uid) return;
      void saveUserData(uid, {
        progress: nextProgress,
        quizzes: nextQuizzes,
        stats: nextStats,
        mistakes: nextMistakes,
      });
    },
    [],
  );

  const lessonStatus = useCallback(
    (lessonId: string): LessonStatus => {
      const index = course.lessons.findIndex((l) => l.id === lessonId);
      if (index < 0) return "locked";
      const own = progress[lessonId];
      if (own?.status === "completed") return "completed";
      // Dev mode: nothing is ever gated; reflect real progress otherwise.
      if (devMode) {
        return own?.status === "in_progress" ? "in_progress" : "available";
      }
      const prevLesson = index > 0 ? course.lessons[index - 1] : null;
      const prevCompleted =
        prevLesson != null &&
        progress[prevLesson.id]?.status === "completed";
      // A lesson without a quiz only needs to be completed to open the next one;
      // a lesson with a quiz also requires passing it.
      const prevQuizOk =
        prevLesson != null &&
        (getLessonQuiz(prevLesson.id) == null ||
          bestPercent(quizzes[prevLesson.id]) >= PASS_THRESHOLD);
      const unlocked = index === 0 || (prevCompleted && prevQuizOk);
      if (!unlocked) return "locked";
      return own?.status === "in_progress" ? "in_progress" : "available";
    },
    [progress, quizzes, devMode],
  );

  const resumeIndex = useCallback(
    (lessonId: string): number =>
      progress[lessonId]?.firstIncompleteSlideIndex ?? 0,
    [progress],
  );

  const completeSlide = useCallback(
    (lessonId: string, slideIndex: number, totalSlides: number) => {
      setProgress((prevProgress) => {
        const prev = prevProgress[lessonId];
        const alreadyCompleted = prev?.status === "completed";
        const nextFirstIncomplete = Math.max(
          prev?.firstIncompleteSlideIndex ?? 0,
          slideIndex + 1,
        );
        const isLessonDone = nextFirstIncomplete >= totalSlides;
        const entry: LessonProgress = {
          status: isLessonDone ? "completed" : "in_progress",
          firstIncompleteSlideIndex: Math.min(nextFirstIncomplete, totalSlides),
          updatedAt: Date.now(),
        };
        const nextProgress: ProgressMap = {
          ...prevProgress,
          [lessonId]: entry,
        };

        setStats((prevStats) => {
          let nextStats = bumpStreak(prevStats);
          if (isLessonDone && !alreadyCompleted) {
            nextStats = {
              ...nextStats,
              lessonsCompletedCount: nextStats.lessonsCompletedCount + 1,
            };
          }
          persist(
            nextProgress,
            quizzesRef.current,
            nextStats,
            mistakesRef.current,
          );
          return nextStats;
        });

        return nextProgress;
      });
    },
    [persist],
  );

  const quizResult = useCallback(
    (lessonId: string): QuizResult | undefined => quizzes[lessonId],
    [quizzes],
  );

  const quizStatus = useCallback(
    (lessonId: string): QuizStatus => {
      // Lessons without a quiz never expose one.
      if (getLessonQuiz(lessonId) == null) return "locked";
      if (lessonId === FINAL_QUIZ_ID) {
        // The final exam unlocks once every lesson is completed (dev mode skips
        // the gate). It does not require the per-lesson quizzes to be passed.
        const allDone = course.lessons.every(
          (l) => progress[l.id]?.status === "completed",
        );
        if (!devMode && !allDone) return "locked";
      } else if (!devMode && progress[lessonId]?.status !== "completed") {
        // Normally a lesson quiz needs its lesson completed first.
        return "locked";
      }
      const result = quizzes[lessonId];
      if (!result || result.attempts <= 0) return "available";
      return bestPercent(result) >= PASS_THRESHOLD ? "passed" : "failed";
    },
    [progress, quizzes, devMode],
  );

  const recordQuizAttempt = useCallback(
    (
      lessonId: string,
      correct: number,
      total: number,
      wrong: WrongQuestion[] = [],
    ) => {
      setQuizzes((prevQuizzes) => {
        const prev = prevQuizzes[lessonId];
        const prevPct = bestPercent(prev);
        const attemptPct = total > 0 ? (correct / total) * 100 : 0;
        const keepPrevBest = prev != null && prevPct >= attemptPct;
        const entry: QuizResult = {
          bestCorrect: keepPrevBest ? prev.bestCorrect : correct,
          total: keepPrevBest ? prev.total : total,
          attempts: (prev?.attempts ?? 0) + 1,
          updatedAt: Date.now(),
        };
        const nextQuizzes: QuizResultMap = {
          ...prevQuizzes,
          [lessonId]: entry,
        };

        // A new high score replaces this lesson's ants with the wrong questions
        // from this attempt; otherwise the existing colony is left untouched.
        const isNewBest = !keepPrevBest;
        const nextMistakes: MistakeMap = isNewBest
          ? {
              ...mistakesRef.current,
              [lessonId]: wrong.map((w, i) => makeMistake(lessonId, w, i)),
            }
          : mistakesRef.current;
        if (isNewBest) setMistakes(nextMistakes);

        setStats((prevStats) => {
          const nextStats = bumpStreak(prevStats);
          persist(progressRef.current, nextQuizzes, nextStats, nextMistakes);
          return nextStats;
        });

        return nextQuizzes;
      });
    },
    [persist],
  );

  const resolveMistake = useCallback(
    (lessonId: string, mistakeId: string) => {
      const prevMistakes = mistakesRef.current;
      const list = prevMistakes[lessonId] ?? [];
      if (!list.some((m) => m.id === mistakeId)) return;
      const nextMistakes: MistakeMap = {
        ...prevMistakes,
        [lessonId]: list.filter((m) => m.id !== mistakeId),
      };

      // Recover one quiz point: best score +1, capped at the quiz length.
      const prevResult = quizzesRef.current[lessonId];
      const nextQuizzes: QuizResultMap = prevResult
        ? {
            ...quizzesRef.current,
            [lessonId]: {
              ...prevResult,
              bestCorrect: Math.min(
                prevResult.total,
                prevResult.bestCorrect + 1,
              ),
              updatedAt: Date.now(),
            },
          }
        : quizzesRef.current;

      const nextStats = bumpStreak(statsRef.current);

      setMistakes(nextMistakes);
      setQuizzes(nextQuizzes);
      setStats(nextStats);
      persist(progressRef.current, nextQuizzes, nextStats, nextMistakes);
    },
    [persist],
  );

  const mistakeCount = useCallback(
    (lessonId: string): number => mistakes[lessonId]?.length ?? 0,
    [mistakes],
  );
  const totalMistakes = Object.values(mistakes).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  const completedCount = course.lessons.filter(
    (l) => progress[l.id]?.status === "completed",
  ).length;

  // Lessons with a quiz plus the end-of-course final exam contribute to the
  // course-wide points.
  const quizPointsEarned =
    course.lessons.reduce(
      (sum, l) =>
        sum + (getLessonQuiz(l.id) ? (quizzes[l.id]?.bestCorrect ?? 0) : 0),
      0,
    ) + (quizzes[FINAL_QUIZ_ID]?.bestCorrect ?? 0);
  const quizPointsTotal =
    course.lessons.reduce(
      (sum, l) => sum + (getLessonQuiz(l.id)?.questionCount ?? 0),
      0,
    ) + (getLessonQuiz(FINAL_QUIZ_ID)?.questionCount ?? 0);

  const value: ProgressContextValue = {
    loading,
    progress,
    quizzes,
    stats,
    lessonStatus,
    resumeIndex,
    completeSlide,
    quizResult,
    quizStatus,
    recordQuizAttempt,
    mistakes,
    mistakeCount,
    totalMistakes,
    resolveMistake,
    completedCount,
    totalLessons: course.lessons.length,
    quizPointsEarned,
    quizPointsTotal,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}
