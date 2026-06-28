import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { useProgress } from "../progress/progress-context";
import { FINAL_QUIZ_ID } from "../content/quizzes";
import type { ArmyAnt } from "../types";

const L1 = "l1-two-questions"; // quiz topic (cap 5)
const L3 = "l3-order-rep"; // button topic (cap 5)

function dateStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const today = dateStr(Date.now());
const yesterday = dateStr(Date.now() - 86_400_000);

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

/** Seed an Ant Army into local storage before the provider loads it. */
function seedArmy(army: Record<string, ArmyAnt[]>) {
  localStorage.setItem(
    "cc_userdata_tester",
    JSON.stringify({ antArmy: army }),
  );
}

describe("Ant Army (ProgressContext)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "cc_local_session",
      JSON.stringify({ uid: "tester", email: "t@example.com" }),
    );
  });

  describe("recruitment", () => {
    it("staffs a quiz topic's anthill from the best score, capped at 5", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(L1, 3, 5));
      expect(result.current.antArmy[L1]).toHaveLength(3);
      expect(result.current.antArmy[L1].every((a) => a.rank === 0)).toBe(true);

      // A higher best adds workers; a worse attempt leaves them in place.
      act(() => result.current.recordQuizAttempt(L1, 5, 5));
      expect(result.current.antArmy[L1]).toHaveLength(5);
      act(() => result.current.recordQuizAttempt(L1, 2, 5));
      expect(result.current.antArmy[L1]).toHaveLength(5);
    });

    it("freeing a colony ant adds one worker to the anthill", async () => {
      const { result } = await renderProgress();
      act(() =>
        result.current.recordQuizAttempt(L1, 3, 5, [
          { templateId: "classify" },
          { templateId: "classify" },
        ]),
      );
      expect(result.current.antArmy[L1]).toHaveLength(3);

      const antId = result.current.mistakes[L1][0].id;
      act(() => result.current.resolveMistake(L1, antId));
      expect(result.current.quizResult(L1)).toMatchObject({ bestCorrect: 4 });
      expect(result.current.antArmy[L1]).toHaveLength(4);
    });

    it("creates no ants for the final exam", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recordQuizAttempt(FINAL_QUIZ_ID, 8, 10));
      expect(result.current.antArmy[FINAL_QUIZ_ID]).toBeUndefined();
    });

    it("recruits workers into a button topic up to its cap of 5", async () => {
      const { result } = await renderProgress();
      act(() => result.current.recruitAnt(L3));
      act(() => result.current.recruitAnt(L3));
      act(() => result.current.recruitAnt(L3));
      act(() => result.current.recruitAnt(L3));
      act(() => result.current.recruitAnt(L3));
      act(() => result.current.recruitAnt(L3)); // over cap; ignored
      expect(result.current.antArmy[L3]).toHaveLength(5);
    });
  });

  describe("upgrades and the one-day gate", () => {
    const seedAnt = (over: Partial<ArmyAnt> = {}): ArmyAnt => ({
      id: "ant1",
      rank: 0,
      lastRankChange: yesterday,
      lastRankChangeAt: Date.now() - 86_400_000,
      attemptDate: null,
      attemptsUsed: 0,
      ...over,
    });

    it("promotes an eligible ant when both answers are correct", async () => {
      seedArmy({ "l2-perm-no-rep": [seedAnt()] });
      const { result } = await renderProgress();

      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", true));
      const ant = result.current.antArmy["l2-perm-no-rep"][0];
      expect(ant.rank).toBe(1);
      expect(ant.lastRankChange).toBe(today);
      expect(ant.attemptsUsed).toBe(0);
      // The hill only upgrades when full, so a lone promoted ant keeps it at 0.
      expect(result.current.anthillTier("l2-perm-no-rep")).toBe(0);
    });

    it("only raises the hill tier once the anthill is full (all 5 ants)", async () => {
      const five = Array.from({ length: 5 }, (_, i) => seedAnt({ id: `a${i}` }));
      seedArmy({ "l2-perm-no-rep": five });
      const { result } = await renderProgress();

      // A full hill of workers reads as tier 0...
      expect(result.current.anthillTier("l2-perm-no-rep")).toBe(0);
      act(() => {
        for (const a of five)
          result.current.attemptAntUpgrade("l2-perm-no-rep", a.id, true);
      });
      // ...and rises to warrior only once every ant has been promoted.
      expect(result.current.anthillTier("l2-perm-no-rep")).toBe(1);
    });

    it("keeps a partial anthill at tier 0 even with high-rank ants", async () => {
      seedArmy({ "l2-perm-no-rep": [seedAnt({ rank: 2 })] });
      const { result } = await renderProgress();
      expect(result.current.anthillTier("l2-perm-no-rep")).toBe(0);
    });

    it("does not promote an ant still inside its wait window", async () => {
      seedArmy({
        "l2-perm-no-rep": [
          seedAnt({ lastRankChange: today, lastRankChangeAt: Date.now() }),
        ],
      });
      const { result } = await renderProgress();

      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", true));
      expect(result.current.antArmy["l2-perm-no-rep"][0].rank).toBe(0);
    });

    it("burns one of two daily attempts on a miss, then locks for the day", async () => {
      seedArmy({ "l2-perm-no-rep": [seedAnt()] });
      const { result } = await renderProgress();

      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", false));
      expect(result.current.antArmy["l2-perm-no-rep"][0]).toMatchObject({
        rank: 0,
        attemptsUsed: 1,
        attemptDate: today,
      });

      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", false));
      expect(result.current.antArmy["l2-perm-no-rep"][0].attemptsUsed).toBe(2);

      // Out of attempts today: even a correct attempt cannot promote now.
      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", true));
      expect(result.current.antArmy["l2-perm-no-rep"][0].rank).toBe(0);
    });

    it("never upgrades past general (max rank)", async () => {
      seedArmy({ "l2-perm-no-rep": [seedAnt({ rank: 2 })] });
      const { result } = await renderProgress();

      act(() => result.current.attemptAntUpgrade("l2-perm-no-rep", "ant1", true));
      expect(result.current.antArmy["l2-perm-no-rep"][0].rank).toBe(2);
    });
  });

  describe("persistence across remounts", () => {
    it("keeps recruited ants after the provider remounts", async () => {
      const first = await renderProgress();
      act(() => first.result.current.recruitAnt(L3));
      expect(first.result.current.antArmy[L3]).toHaveLength(1);
      first.unmount();

      const second = await renderProgress();
      expect(second.result.current.antArmy[L3]).toHaveLength(1);
    });
  });
});
