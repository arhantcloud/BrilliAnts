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
  AntArmyMap,
  AntRank,
  ArmyAnt,
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
  anthillCap,
  computeAnthillTier,
  isQuizTopic,
  neighborsAllowGeneral,
} from "../army/config";
import {
  attemptsUsedToday,
  isEligible,
  MAX_RANK,
  UPGRADE_WAIT_MS,
} from "../army/antState";
import { daysBetween, todayStr } from "../army/dates";
import {
  PASS_THRESHOLD,
  ProgressContext,
  type ProgressContextValue,
} from "./progress-context";

/** Dev account: every lesson and quiz is unlocked regardless of progress. */
const DEV_EMAIL = "ghdv@gmail.com";

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

/** A freshly recruited worker ant for a topic's anthill. */
function makeArmyAnt(topicId: string, index: number): ArmyAnt {
  const now = Date.now();
  return {
    id: `${topicId}:army:${now}:${index}:${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    rank: 0,
    // Recruited ants wait one calendar day before their first upgrade.
    lastRankChange: todayStr(),
    lastRankChangeAt: now,
    attemptDate: null,
    attemptsUsed: 0,
  };
}

/**
 * Ensure a quiz topic's anthill holds `desiredWorkers` ants (capped). Only ever
 * ADDS workers, so existing ranks/timers are preserved; because best score only
 * rises and is capped at the quiz length, the hill never exceeds its cap. Returns
 * the same reference when nothing changes (so callers can skip a write).
 */
function syncAnthill(
  prev: AntArmyMap,
  topicId: string,
  desiredWorkers: number,
): AntArmyMap {
  if (!isQuizTopic(topicId)) return prev;
  const target = Math.min(desiredWorkers, anthillCap(topicId));
  const existing = prev[topicId] ?? [];
  if (existing.length >= target) return prev;
  const added = Array.from({ length: target - existing.length }, (_, i) =>
    makeArmyAnt(topicId, existing.length + i),
  );
  return { ...prev, [topicId]: [...existing, ...added] };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const devMode = user?.email?.trim().toLowerCase() === DEV_EMAIL;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [quizzes, setQuizzes] = useState<QuizResultMap>({});
  const [stats, setStats] = useState<UserStats>({ ...emptyStats });
  const [mistakes, setMistakes] = useState<MistakeMap>({});
  const [antArmy, setAntArmy] = useState<AntArmyMap>({});
  const uidRef = useRef<string | null>(null);

  // Mirror the latest state so persist() can always write a consistent, full
  // snapshot even when only one slice changed.
  const progressRef = useRef<ProgressMap>(progress);
  const quizzesRef = useRef<QuizResultMap>(quizzes);
  const statsRef = useRef<UserStats>(stats);
  const mistakesRef = useRef<MistakeMap>(mistakes);
  const antArmyRef = useRef<AntArmyMap>(antArmy);
  // True once the current user's data has finished loading. Until then persist()
  // is a no-op, so an early mutation can never overwrite the stored snapshot
  // (e.g. the freshly recruited/promoted ants) with pre-load empty state.
  const hasLoadedRef = useRef(false);
  // Keep the mirrors in sync after each commit so persist() can always read the
  // latest full snapshot. (Done in an effect, not during render, so we never
  // mutate a ref while rendering.)
  useEffect(() => {
    progressRef.current = progress;
    quizzesRef.current = quizzes;
    statsRef.current = stats;
    mistakesRef.current = mistakes;
    antArmyRef.current = antArmy;
  }, [progress, quizzes, stats, mistakes, antArmy]);

  useEffect(() => {
    let active = true;
    uidRef.current = user?.uid ?? null;
    hasLoadedRef.current = false;
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
          antArmy: {} as AntArmyMap,
        });
    load.then((data) => {
      if (!active) return;
      // Prime the ref mirrors synchronously so the very next persist() (before
      // the sync effect above re-runs) already sees the loaded snapshot.
      progressRef.current = data.progress;
      quizzesRef.current = data.quizzes;
      statsRef.current = data.stats;
      mistakesRef.current = data.mistakes;
      antArmyRef.current = data.antArmy;
      hasLoadedRef.current = true;
      setProgress(data.progress);
      setQuizzes(data.quizzes);
      setStats(data.stats);
      setMistakes(data.mistakes);
      setAntArmy(data.antArmy);
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
      nextAntArmy: AntArmyMap,
    ) => {
      const uid = uidRef.current;
      // Never write before the initial load resolves, or we could clobber the
      // stored snapshot with empty pre-load state.
      if (!uid || !hasLoadedRef.current) return;
      void saveUserData(uid, {
        progress: nextProgress,
        quizzes: nextQuizzes,
        stats: nextStats,
        mistakes: nextMistakes,
        antArmy: nextAntArmy,
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
            antArmyRef.current,
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

        // Correct answers staff this topic's anthill: keep its worker count in
        // step with the best score (quiz topics only; no-op otherwise).
        const nextAntArmy = syncAnthill(
          antArmyRef.current,
          lessonId,
          entry.bestCorrect,
        );
        if (nextAntArmy !== antArmyRef.current) setAntArmy(nextAntArmy);

        setStats((prevStats) => {
          const nextStats = bumpStreak(prevStats);
          persist(
            progressRef.current,
            nextQuizzes,
            nextStats,
            nextMistakes,
            nextAntArmy,
          );
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

      // Freeing a colony ant raises the best score, which staffs one more ant in
      // this topic's anthill (capped). Never exceeds the cap because best <= total.
      const nextAntArmy = syncAnthill(
        antArmyRef.current,
        lessonId,
        nextQuizzes[lessonId]?.bestCorrect ?? 0,
      );

      setMistakes(nextMistakes);
      setQuizzes(nextQuizzes);
      setStats(nextStats);
      if (nextAntArmy !== antArmyRef.current) setAntArmy(nextAntArmy);
      persist(
        progressRef.current,
        nextQuizzes,
        nextStats,
        nextMistakes,
        nextAntArmy,
      );
    },
    [persist],
  );

  const recruitAnt = useCallback(
    (topicId: string) => {
      setAntArmy((prev) => {
        const list = prev[topicId] ?? [];
        if (list.length >= anthillCap(topicId)) return prev;
        const next: AntArmyMap = {
          ...prev,
          [topicId]: [...list, makeArmyAnt(topicId, list.length)],
        };
        setStats((prevStats) => {
          const nextStats = bumpStreak(prevStats);
          persist(
            progressRef.current,
            quizzesRef.current,
            nextStats,
            mistakesRef.current,
            next,
          );
          return nextStats;
        });
        return next;
      });
    },
    [persist],
  );

  const attemptAntUpgrade = useCallback(
    (topicId: string, antId: string, bothCorrect: boolean) => {
      setAntArmy((prev) => {
        const list = prev[topicId] ?? [];
        const idx = list.findIndex((a) => a.id === antId);
        if (idx < 0) return prev;
        const ant = list[idx];
        // Re-check eligibility so a stale UI can't sneak an extra attempt in.
        if (!isEligible(ant)) return prev;
        // Promotion to GENERAL also requires every neighbouring anthill to be
        // at least tier 1; block it here as a safety net behind the UI gate.
        if (
          ant.rank === 1 &&
          !neighborsAllowGeneral(topicId, (id) =>
            computeAnthillTier(prev[id] ?? [], id),
          )
        ) {
          return prev;
        }

        const today = todayStr();
        const usedToday = attemptsUsedToday(ant, today);
        const updated: ArmyAnt = bothCorrect
          ? {
              ...ant,
              rank: (ant.rank + 1) as AntRank,
              lastRankChange: today,
              lastRankChangeAt: Date.now(),
              attemptDate: today,
              attemptsUsed: 0,
            }
          : { ...ant, attemptDate: today, attemptsUsed: usedToday + 1 };

        const nextList = list.slice();
        nextList[idx] = updated;
        const next: AntArmyMap = { ...prev, [topicId]: nextList };

        setStats((prevStats) => {
          const nextStats = bumpStreak(prevStats);
          persist(
            progressRef.current,
            quizzesRef.current,
            nextStats,
            mistakesRef.current,
            next,
          );
          return nextStats;
        });
        return next;
      });
    },
    [persist],
  );

  // TESTING ONLY: mutate a single ant, bypassing the wait/attempt gates.
  const devMutateAnt = useCallback(
    (topicId: string, antId: string, mode: "ready" | "upgrade") => {
      setAntArmy((prev) => {
        const list = prev[topicId] ?? [];
        const idx = list.findIndex((a) => a.id === antId);
        if (idx < 0) return prev;
        const ant = list[idx];
        let updated: ArmyAnt;
        if (mode === "ready") {
          // Make it eligible right now: push the wait fully into the past and
          // refresh today's attempts.
          updated = {
            ...ant,
            lastRankChangeAt: Date.now() - UPGRADE_WAIT_MS - 1000,
            attemptDate: null,
            attemptsUsed: 0,
          };
        } else {
          if (ant.rank >= MAX_RANK) return prev;
          // Promotion to general respects the neighbour rule even via the dev
          // shortcut: every adjacent anthill must be at least tier 1.
          if (
            ant.rank === 1 &&
            !neighborsAllowGeneral(topicId, (id) =>
              computeAnthillTier(prev[id] ?? [], id),
            )
          ) {
            return prev;
          }
          updated = {
            ...ant,
            rank: (ant.rank + 1) as AntRank,
            lastRankChange: todayStr(),
            lastRankChangeAt: Date.now(),
            attemptDate: todayStr(),
            attemptsUsed: 0,
          };
        }
        const nextList = list.slice();
        nextList[idx] = updated;
        const next: AntArmyMap = { ...prev, [topicId]: nextList };
        persist(
          progressRef.current,
          quizzesRef.current,
          statsRef.current,
          mistakesRef.current,
          next,
        );
        return next;
      });
    },
    [persist],
  );

  const anthillTier = useCallback(
    (topicId: string): AntRank => computeAnthillTier(antArmy[topicId] ?? [], topicId),
    [antArmy],
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
    antArmy,
    anthillTier,
    recruitAnt,
    attemptAntUpgrade,
    devMutateAnt,
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
