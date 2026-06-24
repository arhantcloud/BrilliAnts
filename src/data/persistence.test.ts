import { describe, it, expect, beforeEach } from "vitest";
import { emptyStats, loadUserData, saveUserData } from "./persistence";
import type { ProgressMap, UserStats } from "../types";

describe("persistence (offline / localStorage mode)", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty data for an unknown user", async () => {
    const data = await loadUserData("nobody");
    expect(data.progress).toEqual({});
    expect(data.stats).toEqual(emptyStats);
  });

  it("round-trips saved progress and stats", async () => {
    const progress: ProgressMap = {
      "l1-two-questions": {
        status: "completed",
        firstIncompleteSlideIndex: 4,
        updatedAt: 1234,
      },
    };
    const stats: UserStats = {
      currentStreak: 3,
      lastActiveDate: "2026-06-23",
      lessonsCompletedCount: 1,
    };

    await saveUserData("user-1", { progress, stats });
    const loaded = await loadUserData("user-1");

    expect(loaded.progress).toEqual(progress);
    expect(loaded.stats).toEqual(stats);
  });

  it("scopes data per user id", async () => {
    await saveUserData("user-a", {
      progress: { lx: { status: "in_progress", firstIncompleteSlideIndex: 1, updatedAt: 1 } },
      stats: emptyStats,
    });
    const other = await loadUserData("user-b");
    expect(other.progress).toEqual({});
  });

  it("tolerates corrupt local storage gracefully", async () => {
    localStorage.setItem("cc_userdata_corrupt", "{not json");
    const data = await loadUserData("corrupt");
    expect(data.progress).toEqual({});
    expect(data.stats).toEqual(emptyStats);
  });
});
