import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { course } from "../content/course";
import {
  emptyStats,
  loadUserData,
  saveUserData,
} from "../data/persistence";
import type {
  LessonProgress,
  LessonStatus,
  ProgressMap,
  UserStats,
} from "../types";

type ProgressContextValue = {
  loading: boolean;
  progress: ProgressMap;
  stats: UserStats;
  lessonStatus: (lessonId: string) => LessonStatus;
  resumeIndex: (lessonId: string) => number;
  /** Mark a slide complete; advances resume point and handles lesson completion. */
  completeSlide: (
    lessonId: string,
    slideIndex: number,
    totalSlides: number,
  ) => void;
  completedCount: number;
  totalLessons: number;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined,
);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [stats, setStats] = useState<UserStats>({ ...emptyStats });
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProgress({});
      setStats({ ...emptyStats });
      setLoading(false);
      uidRef.current = null;
      return;
    }
    setLoading(true);
    uidRef.current = user.uid;
    loadUserData(user.uid).then((data) => {
      if (!active) return;
      setProgress(data.progress);
      setStats(data.stats);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const persist = useCallback(
    (nextProgress: ProgressMap, nextStats: UserStats) => {
      const uid = uidRef.current;
      if (!uid) return;
      void saveUserData(uid, { progress: nextProgress, stats: nextStats });
    },
    [],
  );

  const lessonStatus = useCallback(
    (lessonId: string): LessonStatus => {
      const index = course.lessons.findIndex((l) => l.id === lessonId);
      if (index < 0) return "locked";
      const own = progress[lessonId];
      if (own?.status === "completed") return "completed";
      const unlocked =
        index === 0 ||
        progress[course.lessons[index - 1].id]?.status === "completed";
      if (!unlocked) return "locked";
      return own?.status === "in_progress" ? "in_progress" : "available";
    },
    [progress],
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
          persist(nextProgress, nextStats);
          return nextStats;
        });

        return nextProgress;
      });
    },
    [persist],
  );

  const completedCount = course.lessons.filter(
    (l) => progress[l.id]?.status === "completed",
  ).length;

  const value: ProgressContextValue = {
    loading,
    progress,
    stats,
    lessonStatus,
    resumeIndex,
    completeSlide,
    completedCount,
    totalLessons: course.lessons.length,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
