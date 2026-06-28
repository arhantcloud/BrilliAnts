import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { upgradeTemplates } from "./registry";
import { createRng } from "../../rng";

/** All twelve Ant Army upgrade template ids (two per topic). */
const ALL_IDS = [
  "classify-quadsort",
  "classify-twin",
  "perm-restricted",
  "perm-circular",
  "seq-constraint",
  "seq-atleastone",
  "comb-must",
  "comb-atleast",
  "multi-min",
  "multi-bounded",
  "dist-fair",
  "dist-capped",
] as const;

/** Templates whose answer is a numeric count (fill-the-formula or multiple choice). */
const NUMERIC_IDS = ALL_IDS.filter((id) => id !== "classify-quadsort");

/**
 * Templates that present four multiple-choice option cards. Only the L1
 * "spot the world" twin remains a card pick; every other numeric upgrade is now
 * a typed C()/P()/equation fill.
 */
const MULTI_CHOICE_IDS = ["classify-twin"] as const;

const CLASSIFY_CELLS = ["permutations", "sequences", "combinations", "multisets"];

describe("Ant Army upgrade registry", () => {
  it("registers exactly the twelve expected templates", () => {
    expect(Object.keys(upgradeTemplates).sort()).toEqual([...ALL_IDS].sort());
  });

  it("each template's id matches its registry key", () => {
    for (const [key, spec] of Object.entries(upgradeTemplates)) {
      expect(spec.id).toBe(key);
    }
  });
});

describe("upgrade templates: generate() is clean and deterministic", () => {
  it.each(NUMERIC_IDS)("%s yields a positive integer answer across seeds", (id) => {
    const spec = upgradeTemplates[id];
    for (let seed = 1; seed <= 30; seed++) {
      const q = spec.generate(createRng(seed));
      const a = q.answer;
      expect(typeof a).toBe("number");
      expect(Number.isInteger(a as number)).toBe(true);
      expect(a as number).toBeGreaterThan(0);
      // Answers stay small enough to type comfortably.
      expect(a as number).toBeLessThanOrEqual(999);
    }
  });

  it("classify-quadsort answers map to the four valid worlds", () => {
    const spec = upgradeTemplates["classify-quadsort"];
    for (let seed = 1; seed <= 30; seed++) {
      const q = spec.generate(createRng(seed));
      const cells = String(q.answer).split(",");
      expect(cells).toHaveLength(4);
      for (const c of cells) expect(CLASSIFY_CELLS).toContain(c);
      // Each scenario row has a matching cell answer.
      expect(String(q.params.scenarios).split("\n")).toHaveLength(4);
      expect(q.params.answers).toBe(q.answer);
    }
  });

  it.each(MULTI_CHOICE_IDS)("%s exposes four distinct options with a valid correct index", (id) => {
    const spec = upgradeTemplates[id];
    for (let seed = 1; seed <= 30; seed++) {
      const q = spec.generate(createRng(seed));
      const opts = String(q.params.opts).split(",").map(Number);
      const correct = Number(q.params.correct);
      expect(opts).toHaveLength(4);
      expect(new Set(opts).size).toBe(4);
      expect(correct).toBeGreaterThanOrEqual(0);
      expect(correct).toBeLessThan(4);
      // The flagged option equals the recorded answer.
      expect(opts[correct]).toBe(q.answer);
    }
  });

  it.each(ALL_IDS)("%s is deterministic for a given seed", (id) => {
    const spec = upgradeTemplates[id];
    expect(spec.generate(createRng(42))).toEqual(spec.generate(createRng(42)));
  });
});

describe("upgrade templates: interactions grade correctly", () => {
  it("a multiple-choice upgrade scores true on the correct card", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["classify-twin"];
    const q = spec.generate(createRng(7));
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    const opts = String(q.params.opts).split(",").map(Number);
    const correct = Number(q.params.correct);
    await user.click(
      screen.getByRole("button", { name: String(opts[correct]) }),
    );
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it("a multiple-choice upgrade scores false on a wrong card", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["classify-twin"];
    const q = spec.generate(createRng(9));
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    const opts = String(q.params.opts).split(",").map(Number);
    const correct = Number(q.params.correct);
    const wrongIdx = (correct + 1) % 4;
    await user.click(
      screen.getByRole("button", { name: String(opts[wrongIdx]) }),
    );
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("the quad-sort scores true when all four are sorted correctly", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["classify-quadsort"];
    const q = spec.generate(createRng(3));
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    const LABELS: Record<string, string> = {
      permutations: "Permutations",
      sequences: "Sequences",
      combinations: "Combinations",
      multisets: "Multisets",
    };
    const answers = String(q.answer).split(",");
    for (let row = 0; row < answers.length; row++) {
      await user.click(
        screen.getByRole("button", {
          name: `Scenario ${row + 1}: ${LABELS[answers[row]]}`,
        }),
      );
    }
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it("a P()/factorial fill scores true when every blank is correct", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["perm-circular"];
    const q = spec.generate(createRng(4));
    const n = Number(q.params.n);
    const answer = Number(q.answer);
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    await user.type(screen.getByLabelText("friends to arrange"), String(n - 1));
    await user.type(screen.getByLabelText("seatings"), String(answer));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it("a subtract-equation fill scores true when total, removed, and result are correct", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["comb-atleast"];
    const q = spec.generate(createRng(9));
    const total = Number(q.params.total);
    const none = Number(q.params.none);
    const answer = Number(q.answer);
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    await user.type(screen.getByLabelText("all ways"), String(total));
    await user.type(screen.getByLabelText("expert-free choices"), String(none));
    await user.type(screen.getByLabelText("answer"), String(answer));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it("a fill upgrade scores false when a blank is wrong", async () => {
    const user = userEvent.setup();
    const spec = upgradeTemplates["comb-must"];
    const q = spec.generate(createRng(5));
    const n = Number(q.params.n);
    const k = Number(q.params.k);
    const answer = Number(q.answer);
    const onResult = vi.fn();
    render(<spec.Component question={q} locked={false} onResult={onResult} />);

    // Correct args, but a deliberately wrong final count.
    await user.type(screen.getByLabelText("people remaining"), String(n - 1));
    await user.type(screen.getByLabelText("spots remaining"), String(k - 1));
    await user.type(screen.getByLabelText("teams"), String(answer + 1));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledWith(false);
  });
});
