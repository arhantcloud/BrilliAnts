import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { quizTemplates } from "./registry";
import type { QuizQuestionSpec } from "./QuizQuestionSpec";
import { createRng, permutations, combinations, factorial, power, multisets } from "./rng";
import { drawQuiz } from "../content/quizzes";
import type { GeneratedQuestion } from "../types";

/**
 * Templates with bespoke answer drivers in this file (classify toggles,
 * permutation cross-out, combination derivation).
 */
const TEMPLATE_IDS = [
  "classify",
  "permutation",
  "combination",
] as const;

/** Every template id the framework ships with (see registry.ts). */
const ALL_TEMPLATE_IDS = [
  "classify",
  "permutation",
  "combination",
  "sequence",
  "multiset",
  "distribute",
] as const;

/** The four counting "cells" the classify template answers with. */
const CLASSIFY_CELLS = [
  "permutations",
  "sequences",
  "combinations",
  "multisets",
];

/**
 * The two binary toggle settings (order matters? / can items repeat?) that the
 * classify template derives each counting cell from.
 */
const CELL_TOGGLES: Record<string, { order: boolean; repeat: boolean }> = {
  permutations: { order: true, repeat: false },
  sequences: { order: true, repeat: true },
  combinations: { order: false, repeat: false },
  multisets: { order: false, repeat: true },
};

const isClassify = (id: string) => id === "classify";
const isPermutation = (id: string) => id === "permutation";
const isCombination = (id: string) => id === "combination";

/**
 * Drive the combination question's guided derivation: fill P(n,k) (n, k, and the
 * count) to unlock step 2, fill k! (base + factorial) to unlock the division,
 * then fill every number in C(n,k)=P/k!. The first two steps are always filled
 * correctly so `correct` only controls whether the final result is right.
 */
async function submitCombination(
  user: ReturnType<typeof userEvent.setup>,
  question: GeneratedQuestion,
  correct: boolean,
) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);
  const P = permutations(n, k);
  const kf = factorial(k);
  const fill = async (name: string, v: number) =>
    user.type(screen.getByRole("textbox", { name }), String(v));

  await fill("permutation n", n);
  await fill("permutation k", k);
  await fill("permutation count", P);
  await fill("k base", k);
  await fill("k factorial count", kf);
  await fill("combination n", n);
  await fill("combination k", k);
  await fill("numerator", P);
  await fill("denominator", kf);
  await fill("combination result", correct ? answer : answer + 1);
}

/**
 * Drive the permutation question: n! is written out as a descending product and
 * the learner crosses out the tail factors that cancel (values 1..n−k), then
 * types the final count. We always cross out correctly, so `correct` only
 * controls whether the typed final answer is right.
 */
async function submitPermutation(
  user: ReturnType<typeof userEvent.setup>,
  question: GeneratedQuestion,
  correct: boolean,
) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);

  for (let v = 1; v <= n - k; v++) {
    await user.click(screen.getByRole("button", { name: `factor ${v}` }));
  }

  const value = correct ? answer : answer + 1;
  await user.type(
    screen.getByRole("textbox", { name: /final answer/i }),
    String(value),
  );
}

/**
 * Drive a single question view to either the correct or a deliberately wrong
 * answer, then submit. Branches on the template's answer style (typed category
 * name for classify vs. digit dial for the numeric templates).
 */
async function submitAnswer(
  user: ReturnType<typeof userEvent.setup>,
  spec: QuizQuestionSpec,
  question: GeneratedQuestion,
  correct: boolean,
) {
  if (isClassify(spec.id)) {
    const answerCell = String(question.answer);
    // A correct answer agrees with the real cell on BOTH the toggles and the
    // typed name; a wrong answer points both at a different cell.
    const target = correct
      ? answerCell
      : CLASSIFY_CELLS.find((c) => c !== answerCell)!;
    const { order, repeat } = CELL_TOGGLES[target];
    await user.click(
      screen.getByRole("button", {
        name: `Does order matter? ${order ? "Yes" : "No"}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `Can items repeat? ${repeat ? "Yes" : "No"}`,
      }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /category name/i }),
      target,
    );
  } else if (isPermutation(spec.id)) {
    await submitPermutation(user, question, correct);
  } else if (isCombination(spec.id)) {
    await submitCombination(user, question, correct);
  }
  await user.click(screen.getByRole("button", { name: /^submit$/i }));
}

describe("quiz registry", () => {
  it("registers exactly the expected templates", () => {
    expect(Object.keys(quizTemplates).sort()).toEqual(
      [...ALL_TEMPLATE_IDS].sort(),
    );
  });

  it("each template's id matches its registry key", () => {
    for (const [key, spec] of Object.entries(quizTemplates)) {
      expect(spec.id).toBe(key);
    }
  });
});

describe("quiz templates: generate() produces well-formed answers", () => {
  it.each(ALL_TEMPLATE_IDS)(
    "%s yields clean answers across many seeds",
    (id) => {
      const spec = quizTemplates[id];
      expect(spec).toBeDefined();

      for (let seed = 1; seed <= 25; seed++) {
        const q = spec.generate(createRng(seed));
        expect(q).toHaveProperty("params");
        expect(q).toHaveProperty("answer");
        expect(typeof q.params).toBe("object");

        if (isClassify(id)) {
          expect(typeof q.answer).toBe("string");
          expect(CLASSIFY_CELLS).toContain(q.answer);
          // The prompt the view renders must be present.
          expect(typeof q.params.prompt).toBe("string");
        } else {
          expect(typeof q.answer).toBe("number");
          const n = q.answer as number;
          expect(Number.isInteger(n)).toBe(true);
          expect(Number.isFinite(n)).toBe(true);
          expect(n).toBeGreaterThan(0);
        }
      }
    },
  );

  it("is deterministic for a given seed", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      const spec = quizTemplates[id];
      const a = spec.generate(createRng(99));
      const b = spec.generate(createRng(99));
      expect(a).toEqual(b);
    }
  });
});

describe("quiz templates: submitting answers", () => {
  it.each(TEMPLATE_IDS)(
    "%s calls onResult(true) and locks after a correct answer",
    async (id) => {
      const user = userEvent.setup();
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(7));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked={false} onResult={onResult} />,
      );

      await submitAnswer(user, spec, question, true);

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(true);

      // Single-attempt lock: the Submit control is gone once answered.
      expect(
        screen.queryByRole("button", { name: /^submit$/i }),
      ).not.toBeInTheDocument();

      if (isClassify(id)) {
        expect(
          screen.getByRole("textbox", { name: /category name/i }),
        ).toBeDisabled();
      } else if (isPermutation(id)) {
        expect(
          screen.getByRole("textbox", { name: /final answer/i }),
        ).toBeDisabled();
      } else if (isCombination(id)) {
        expect(
          screen.getByRole("textbox", { name: "combination result" }),
        ).toBeDisabled();
      }
    },
  );

  it.each(TEMPLATE_IDS)(
    "%s calls onResult(false) after a wrong answer",
    async (id) => {
      const user = userEvent.setup();
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(13));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked={false} onResult={onResult} />,
      );

      await submitAnswer(user, spec, question, false);

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(false);

      // Single-attempt lock applies on a wrong answer too: Submit disappears
      // and the controls freeze.
      expect(
        screen.queryByRole("button", { name: /^submit$/i }),
      ).not.toBeInTheDocument();

      if (isClassify(id)) {
        expect(
          screen.getByRole("textbox", { name: /category name/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Does order matter? Yes" }),
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Can items repeat? Yes" }),
        ).toBeDisabled();
      } else if (isPermutation(id)) {
        expect(
          screen.getByRole("textbox", { name: /final answer/i }),
        ).toBeDisabled();
      } else if (isCombination(id)) {
        expect(
          screen.getByRole("textbox", { name: "combination result" }),
        ).toBeDisabled();
      }
    },
  );

  it("permutation fill-formula (style 1) scores true when every blank is right", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.permutation;
    const n = 7;
    const k = 3;
    const answer = permutations(n, k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 0, style: 1 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );

    const fill = async (name: string, v: number) =>
      user.type(screen.getByRole("textbox", { name }), String(v));
    await fill("formula notation n", n);
    await fill("formula notation k", k);
    await fill("formula numerator n", n);
    await fill("formula denominator n", n);
    await fill("formula denominator k", k);
    await fill("formula result", answer);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.getByRole("textbox", { name: "formula result" })).toBeDisabled();
  });

  it("permutation fill-formula (style 1) scores false on a wrong result", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.permutation;
    const n = 6;
    const k = 2;
    const answer = permutations(n, k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 1, style: 1 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );
    const fill = async (name: string, v: number) =>
      user.type(screen.getByRole("textbox", { name }), String(v));
    await fill("formula notation n", n);
    await fill("formula notation k", k);
    await fill("formula numerator n", n);
    await fill("formula denominator n", n);
    await fill("formula denominator k", k);
    await fill("formula result", answer + 1);
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("permutation descending-product (style 2) scores true with the right factors", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.permutation;
    const n = 7;
    const k = 3;
    const answer = permutations(n, k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 2, style: 2 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );
    for (let i = 1; i <= k; i++) {
      await user.type(
        screen.getByRole("textbox", { name: `term ${i}` }),
        String(n - (i - 1)),
      );
    }
    await user.type(
      screen.getByRole("textbox", { name: "product result" }),
      String(answer),
    );
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.getByRole("textbox", { name: "product result" })).toBeDisabled();
  });

  it("Lesson 2 draws two cross-out, two fill-formula, and one product", () => {
    const styles = drawQuiz("l2-perm-no-rep", createRng(5))
      .map((q) => Number(q.params.style))
      .sort();
    expect(styles).toEqual([0, 0, 1, 1, 2]);
  });

  it("combination shows every step at once and only grades on submit", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.combination;
    const n = 6;
    const k = 3;
    const answer = combinations(n, k);
    const P = permutations(n, k);
    const kf = factorial(k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 0 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );

    // No gating: all three steps' fields are present from the start.
    expect(
      screen.getByRole("textbox", { name: "permutation count" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "k factorial count" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "combination result" }),
    ).toBeInTheDocument();

    // Submit stays disabled until every box is filled (no early grading).
    await user.type(screen.getByRole("textbox", { name: "permutation count" }), String(P));
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "permutation n" }), String(n));
    await user.type(screen.getByRole("textbox", { name: "permutation k" }), String(k));
    await user.type(screen.getByRole("textbox", { name: "k base" }), String(k));
    await user.type(screen.getByRole("textbox", { name: "k factorial count" }), String(kf));
    await user.type(screen.getByRole("textbox", { name: "combination n" }), String(n));
    await user.type(screen.getByRole("textbox", { name: "combination k" }), String(k));
    await user.type(screen.getByRole("textbox", { name: "numerator" }), String(P));
    await user.type(screen.getByRole("textbox", { name: "denominator" }), String(kf));
    const result = screen.getByRole("textbox", { name: "combination result" });
    await user.type(result, String(answer));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
    expect(result).toBeDisabled();
  });

  it("combination scores the whole question wrong if any sub-step is wrong", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.combination;
    const n = 6;
    const k = 3;
    const answer = combinations(n, k);
    const P = permutations(n, k);
    const kf = factorial(k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 0 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );

    // Everything correct EXCEPT step 1's ordered count, so the final result is
    // still entered correctly, but the question must still fail.
    await user.type(screen.getByRole("textbox", { name: "permutation n" }), String(n));
    await user.type(screen.getByRole("textbox", { name: "permutation k" }), String(k));
    await user.type(
      screen.getByRole("textbox", { name: "permutation count" }),
      String(P + 1),
    );
    await user.type(screen.getByRole("textbox", { name: "k base" }), String(k));
    await user.type(screen.getByRole("textbox", { name: "k factorial count" }), String(kf));
    await user.type(screen.getByRole("textbox", { name: "combination n" }), String(n));
    await user.type(screen.getByRole("textbox", { name: "combination k" }), String(k));
    await user.type(screen.getByRole("textbox", { name: "numerator" }), String(P));
    await user.type(screen.getByRole("textbox", { name: "denominator" }), String(kf));
    await user.type(
      screen.getByRole("textbox", { name: "combination result" }),
      String(answer),
    );
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("combination derive scores false when a final number is wrong", async () => {
    const user = userEvent.setup();
    const spec = quizTemplates.combination;
    const n = 5;
    const k = 2;
    const answer = combinations(n, k);
    const onResult = vi.fn();

    render(
      <spec.Component
        question={{ params: { n, k, theme: 1 }, answer }}
        locked={false}
        onResult={onResult}
      />,
    );
    await submitCombination(
      user,
      { params: { n, k, theme: 1 }, answer },
      false,
    );
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("Lesson 4 draws five guided-derivation questions", () => {
    const questions = drawQuiz("l4-comb-no-rep", createRng(5));
    expect(questions).toHaveLength(5);
    for (const q of questions) {
      expect(Number.isInteger(q.answer as number)).toBe(true);
      expect(q.params.n).toBeGreaterThanOrEqual(5);
      expect([2, 3]).toContain(q.params.k);
    }
  });

  it.each(ALL_TEMPLATE_IDS)(
    "%s honors the player-driven lock (no interaction when locked)",
    (id) => {
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(3));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked onResult={onResult} />,
      );

      if (isClassify(id)) {
        expect(
          screen.getByRole("textbox", { name: /category name/i }),
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Does order matter? Yes" }),
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Can items repeat? Yes" }),
        ).toBeDisabled();
      } else if (isPermutation(id)) {
        expect(
          screen.getByRole("textbox", { name: /final answer/i }),
        ).toBeDisabled();
      } else if (isCombination(id)) {
        expect(
          screen.getByRole("textbox", { name: "permutation n" }),
        ).toBeDisabled();
      }
      expect(onResult).not.toHaveBeenCalled();
    },
  );
});

describe("formula-fill templates (sequence, multiset, distribute)", () => {
  /** Fill a list of [aria-label, value] blanks. */
  async function fillBlanks(
    user: ReturnType<typeof userEvent.setup>,
    blanks: [string, number][],
  ) {
    for (const [name, value] of blanks) {
      await user.type(screen.getByRole("textbox", { name }), String(value));
    }
  }

  /** The three blanks (label + correct value) for one generated question. */
  function blanksFor(id: string, q: GeneratedQuestion): [string, number][] {
    if (id === "sequence") {
      const n = Number(q.params.n);
      const k = Number(q.params.k);
      return [
        ["sequence base", n],
        ["sequence exponent", k],
        ["sequence result", power(n, k)],
      ];
    }
    if (id === "multiset") {
      const n = Number(q.params.n);
      const k = Number(q.params.k);
      return [
        ["multiset first part", k + n - 1],
        ["multiset second part", n - 1],
        ["multiset result", multisets(k, n)],
      ];
    }
    const items = Number(q.params.items);
    const bins = Number(q.params.bins);
    return [
      ["distribute first part", items + bins - 1],
      ["distribute second part", bins - 1],
      ["distribute result", multisets(items, bins)],
    ];
  }

  const FORMULA_IDS = ["sequence", "multiset", "distribute"] as const;

  it.each(FORMULA_IDS)(
    "%s scores true when every blank is filled correctly",
    async (id) => {
      const user = userEvent.setup();
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(7));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked={false} onResult={onResult} />,
      );

      const blanks = blanksFor(id, question);
      await fillBlanks(user, blanks);
      await user.click(screen.getByRole("button", { name: /^submit$/i }));

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(true);
      // Single-attempt lock: Submit is gone and the result blank is frozen.
      expect(
        screen.queryByRole("button", { name: /^submit$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: blanks[2][0] }),
      ).toBeDisabled();
    },
  );

  it.each(FORMULA_IDS)(
    "%s scores false when the result blank is wrong",
    async (id) => {
      const user = userEvent.setup();
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(11));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked={false} onResult={onResult} />,
      );

      const blanks = blanksFor(id, question);
      // Fill the two arguments correctly, but the result deliberately wrong.
      await fillBlanks(user, [blanks[0], blanks[1], [blanks[2][0], blanks[2][1] + 1]]);
      await user.click(screen.getByRole("button", { name: /^submit$/i }));

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(false);
    },
  );

  it.each(FORMULA_IDS)(
    "%s keeps Submit disabled until every blank is filled",
    async (id) => {
      const user = userEvent.setup();
      const spec = quizTemplates[id];
      const question = spec.generate(createRng(5));
      const onResult = vi.fn();

      render(
        <spec.Component question={question} locked={false} onResult={onResult} />,
      );

      const blanks = blanksFor(id, question);
      await user.type(
        screen.getByRole("textbox", { name: blanks[0][0] }),
        String(blanks[0][1]),
      );
      expect(screen.getByRole("button", { name: /^submit$/i })).toBeDisabled();
    },
  );
});

describe("final-exam draw", () => {
  it.each(["l3-order-rep", "l5-choice-distribution", "l6-choose-distribute"])(
    "%s has no standalone quiz (its types live in the final exam)",
    (lessonId) => {
      expect(drawQuiz(lessonId, createRng(5))).toHaveLength(0);
    },
  );

  it("the course final draws 10 questions across all concept areas", () => {
    const questions = drawQuiz("course-final", createRng(9));
    expect(questions).toHaveLength(10);
    // classify yields a string answer; every other slot is a positive integer.
    for (const q of questions) {
      const a = q.answer;
      if (typeof a === "string") {
        expect(a.length).toBeGreaterThan(0);
      } else {
        expect(Number.isInteger(a)).toBe(true);
        expect(a).toBeGreaterThan(0);
      }
    }
  });
});
