import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { ProgressProvider, useProgress } from "./ProgressContext";
import { course } from "../content/course";

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

  it("completes a lesson, unlocks the next, and counts it once", async () => {
    const { result } = await renderProgress();
    act(() => {
      for (let i = 0; i < L1.slides.length; i++) {
        result.current.completeSlide(L1.id, i, L1.slides.length);
      }
    });

    expect(result.current.lessonStatus(L1.id)).toBe("completed");
    expect(result.current.lessonStatus(L2.id)).toBe("available");
    expect(result.current.completedCount).toBe(1);
    expect(result.current.stats.lessonsCompletedCount).toBe(1);
    expect(result.current.stats.currentStreak).toBe(1);
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
});
