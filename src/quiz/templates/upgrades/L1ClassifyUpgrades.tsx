import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { combinations, permutations, power, multisets, type Rng } from "../../rng";
import {
  MultiChoice,
  QuadSort,
  buildNumericChoices,
  shuffle,
  type SortCell,
} from "./shared";

/**
 * Ant Army upgrade challenges for topic l1 (The Four Kinds). Both are harder and
 * use formats the lesson quiz does not:
 *  - worker -> warrior: sort FOUR scenarios into the four counting worlds at once.
 *  - warrior -> general: a "twin trap" - pick the right count among look-alikes.
 */

const CELLS: SortCell[] = [
  { key: "permutations", label: "Permutations" },
  { key: "sequences", label: "Sequences" },
  { key: "combinations", label: "Combinations" },
  { key: "multisets", label: "Multisets" },
];

type Build = (n: number, k: number) => string;

const SCENARIOS: Record<string, Build[]> = {
  permutations: [
    (n, k) => `Hand out ${k} distinct prizes (1st, 2nd, ...) to ${n} contestants.`,
    (n, k) => `Arrange ${k} of ${n} different books in a row on a shelf.`,
  ],
  sequences: [
    (n, k) => `Set a ${k}-symbol passcode using ${n} possible characters (repeats allowed).`,
    (n, k) => `Roll a ${n}-sided die ${k} times and record the sequence in order.`,
  ],
  combinations: [
    (n, k) => `Pick a ${k}-person committee from ${n} volunteers (no roles).`,
    (n, k) => `Choose ${k} different toppings from ${n} options for one pizza.`,
  ],
  multisets: [
    (n, k) => `Scoop ${k} cones choosing from ${n} flavors (repeats allowed, order ignored).`,
    (n, k) => `Buy ${k} donuts choosing from ${n} kinds (you may repeat kinds).`,
  ],
};

/* ------------------------------ quad sort (warrior) ----------------------------- */

function generateQuadSort(rng: Rng): GeneratedQuestion {
  const n = rng.int(5, 9);
  const k = rng.int(2, 4);
  // One scenario per cell, in a random row order.
  const order = shuffle(rng, CELLS).map((c) => c.key);
  const texts = order.map((cellKey) => rng.pick(SCENARIOS[cellKey])(n, k));
  return {
    params: { n, k, scenarios: texts.join("\n"), answers: order.join(",") },
    answer: order.join(","),
  };
}

function QuadSortQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const scenarios = String(question.params.scenarios).split("\n");
  const answers = String(question.params.answers).split(",");
  return (
    <QuadSort
      tag="Sort all four"
      prompt={
        <>
          Drop each scenario into its counting world. They must <b>all</b> be
          right to earn the promotion.
        </>
      }
      scenarios={scenarios}
      cells={CELLS}
      answers={answers}
      locked={locked}
      onResult={onResult}
    />
  );
}

export const quadsortSpec: QuizQuestionSpec = {
  id: "classify-quadsort",
  lessonId: "l1-two-questions",
  generate: generateQuadSort,
  Component: QuadSortQuestion,
};

/* ------------------------------- twin trap (general) ---------------------------- */

function generateTwin(rng: Rng): GeneratedQuestion {
  const world = rng.bool() ? 0 : 1; // 0 = order matters (P), 1 = order ignored (C)
  const n = rng.int(5, 7);
  const k = rng.int(2, 3);
  const P = permutations(n, k);
  const C = combinations(n, k);
  const correct = world === 0 ? P : C;
  const { values, correctIndex } = buildNumericChoices(rng, correct, [
    P,
    C,
    power(n, k),
    multisets(n, k),
  ]);
  return {
    params: { n, k, world, opts: values.join(","), correct: correctIndex },
    answer: correct,
  };
}

function TwinQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const world = Number(question.params.world);
  const opts = String(question.params.opts).split(",").map(Number);
  const correctIndex = Number(question.params.correct);

  const prompt =
    world === 0 ? (
      <>
        From <b>{n}</b> finalists, how many ways are there to award <b>{k}</b>{" "}
        ranked prizes (1st, 2nd, ...)? <i>Order matters; no one wins twice.</i>
      </>
    ) : (
      <>
        From <b>{n}</b> finalists, how many ways are there to pick a group of{" "}
        <b>{k}</b> with <i>no ranking</i>? <i>Order does not matter.</i>
      </>
    );

  return (
    <MultiChoice
      tag="Spot the world"
      prompt={prompt}
      options={opts.map((v) => ({ label: v.toLocaleString() }))}
      correctIndex={correctIndex}
      locked={locked}
      onResult={onResult}
    />
  );
}

export const twinSpec: QuizQuestionSpec = {
  id: "classify-twin",
  lessonId: "l1-two-questions",
  generate: generateTwin,
  Component: TwinQuestion,
};
