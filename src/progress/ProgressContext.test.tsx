import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { ProgressProvider } from "./ProgressContext";
import { useProgress } from "./progress-context";
import { course } from "../content/course";
import { getLessonQuiz } from "../content/quizzes";

const L1 = course.lessons[0];
const L2 = course.lessons[1];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthProvider>
  );
}

async function renderProgress() {
  const view = renderHook(() => useProgress(), { wrapper });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("ProgressContext", () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed a logged-in local session so the provider tracks progress.
    localStorage.setItem(
      "cc_local_session",
      JSON.stringify({ uid: "tester", email: "t@example.com" }),
    );
  });

  it("starts the first lesson available and later lessons locked", async () => {
    const { result } = await renderProgress();
    expect(result.current.lessonStatus(L1.id)).toBe("available");
    expect(result.current.lessonStatus(L2.id)).toBe("locked");
    expect(result.current.completedCount).toBe(0);
  });

  it("marks a lesson in_progress and advances the resume index", async () => {
    const { result } = await renderProgress();
    act(() => result.current.completeSlide(L1.id, 0, L1.slides.length));
    expect(result.current.lessonStatus(L1.id)).toBe("in_progress");
    expect(result.current.resumeIndex(L1.id)).toBe(1);
  });

  it("completes a lesson and counts it, but keeps the next locked until its quiz passes", async () => {
    const { result } = await renderProgress();
    act(() => {
      for (let i = 0; i < L1.slides.length; i++) {
        result.current.completeSlide(L1.id, i, L1.slides.length);
      }
    });

    expect(result.current.lessonStatus(L1.id)).toBe("completed");
    // New gating: finishing the lesson is no longer enough to open the next one.
    expect(result.current.lessonStatus(L2.id)).toBe("locked");
    expect(result.current.completedCount).toBe(1);
    expect(result.current.stats.lessonsCompletedCount).toBe(1);
    expect(result.current.stats.currentStreak).toBe(1);

    // Passing L1's quiz (>= 60%) is what unlocks L2.
    act(() => result.current.recordQuizAttempt(L1.id, 3, 5));
    expect(result.current.lessonStatus(L2.id)).toBe("available");
  });

  it("does not double-count completing the same lesson again", async () => {
    const { result } = await renderProgress();
    act(() => {
      for (let i = 0; i < L1.slides.length; i++) {
        result.current.completeSlide(L1.id, i, L1.slides.length);
      }
    });
    act(() => {
      // Replaying the last slide should not bump the completed count again.
      result.current.completeSlide(L1.id, L1.slides.length - 1, L1.slides.length);
    });
    expect(result.current.stats.lessonsCompletedCount).toBe(1);
  });

  it("persists progress across provider remounts", async () => {
    const first = await renderProgress();
    act(() => {
      for (let i = 0; i < L1.slides.length; i++) {
        first.result.current.completeSlide(L1.id, i, L1.slides.length);
      }
    });
    first.unmount();

    const second = await renderProgress();
    expect(second.result.current.lessonStatus(L1.id)).toBe("completed");
    expect(second.result.current.completedCount).toBe(1);
  });

  function completeLesson(
    result: { current: ReturnType<typeof useProgress> },
    lesson: typeof L1,
  ) {
    act(() => {
      for (let i = 0; i < lesson.slides.length; i++) {
        result.current.completeSlide(lesson.id, i, lesson.slides.length);
      }
    });
  }

  describe("recordQuizAttempt best-score logic", () => {
    it("records the first attempt's score and bumps the attempt count", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(L1.id, 3, 5));

      const r = result.current.quizResult(L1.id);
      expect(r).toMatchObject({ bestCorrect: 3, total: 5, attempts: 1 });
    });

    it("keeps the best score when a later attempt is worse", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(L1.id, 4, 5));
      act(() => result.current.recordQuizAttempt(L1.id, 1, 5));

      const r = result.current.quizResult(L1.id);
      expect(r).toMatchObject({ bestCorrect: 4, total: 5, attempts: 2 });
    });

    it("upgrades the best score when a later attempt is better", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(L1.id, 2, 5));
      act(() => result.current.recordQuizAttempt(L1.id, 5, 5));

      const r = result.current.quizResult(L1.id);
      expect(r).toMatchObject({ bestCorrect: 5, total: 5, attempts: 2 });
    });

    it("accumulates quiz points from the best correct counts", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(L1.id, 3, 5));
      expect(result.current.quizPointsEarned).toBe(3);
      // Only lessons that actually have a quiz contribute to the total.
      const expectedTotal = course.lessons.reduce(
        (sum, l) => sum + (getLessonQuiz(l.id)?.questionCount ?? 0),
        0,
      );
      expect(result.current.quizPointsTotal).toBe(expectedTotal);
    });
  });

  describe("quizStatus transitions", () => {
    it("is locked until the lesson is completed", async () => {
      const { result } = await renderProgress();
      expect(result.current.quizStatus(L1.id)).toBe("locked");
    });

    it("becomes available once the lesson is completed but not yet attempted", async () => {
      const { result } = await renderProgress();
      completeLesson(result, L1);
      expect(result.current.quizStatus(L1.id)).toBe("available");
    });

    it("is failed after an attempt below the pass threshold", async () => {
      const { result } = await renderProgress();
      completeLesson(result, L1);
      act(() => result.current.recordQuizAttempt(L1.id, 2, 5)); // 40%
      expect(result.current.quizStatus(L1.id)).toBe("failed");
    });

    it("is passed after an attempt at or above the pass threshold", async () => {
      const { result } = await renderProgress();
      completeLesson(result, L1);
      act(() => result.current.recordQuizAttempt(L1.id, 3, 5)); // 60%
      expect(result.current.quizStatus(L1.id)).toBe("passed");
    });
  });

  describe("the 60% quiz gate on the next lesson", () => {
    it("keeps the next lesson locked after a failing quiz", async () => {
      const { result } = await renderProgress();
      completeLesson(result, L1);
      act(() => result.current.recordQuizAttempt(L1.id, 2, 5)); // 40%
      expect(result.current.lessonStatus(L2.id)).toBe("locked");
    });

    it("unlocks the next lesson once the quiz is passed at exactly 60%", async () => {
      const { result } = await renderProgress();
      completeLesson(result, L1);
      act(() => result.current.recordQuizAttempt(L1.id, 3, 5)); // 60%
      expect(result.current.lessonStatus(L2.id)).toBe("available");
    });

    it("requires both lesson completion and a passing quiz", async () => {
      const { result } = await renderProgress();
      // Passing a quiz without finishing the lesson cannot happen via the UI,
      // but the gate must still hold: L2 stays locked while L1 is incomplete.
      act(() => result.current.recordQuizAttempt(L1.id, 5, 5));
      expect(result.current.lessonStatus(L1.id)).toBe("available");
      expect(result.current.lessonStatus(L2.id)).toBe("locked");
    });
  });
});
