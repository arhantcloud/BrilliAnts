import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { multisets, type Rng } from "../rng";
import { FormulaFill, QuestionShell, type FormulaField } from "./shared";
import { multisetBoxes } from "../../mascot/boxExplanations";

/**
 * Lesson 5: order doesn't matter, with reuse: multisets, C(n + k − 1, k).
 *
 * Inspired by the lesson's "scoops in a cup" idea (pick k from n kinds, repeats
 * allowed, order ignored). Uses the same fill-the-formula interaction as the
 * other quizzes: the learner fills the two combination arguments and the result.
 * No dial, no stars-and-bars visual.
 */

type Theme = {
  /** What is being chosen, e.g. "scoops". */
  pick: string;
  /** The pool of kinds, e.g. "flavors". */
  kind: string;
  /** Container that ignores order, e.g. "cup". */
  container: string;
};

const THEMES: Theme[] = [
  { pick: "scoops", kind: "flavors", container: "cup" },
  { pick: "donuts", kind: "types", container: "box" },
  { pick: "candies", kind: "flavors", container: "bag" },
];

/** n kinds, k picks. The count is C(k + n − 1, n − 1) = multisets(k, n). */
function generate(rng: Rng): GeneratedQuestion {
  const n = rng.int(3, 6); // flavors / kinds
  const k = rng.int(2, 4); // scoops / picks
  const theme = rng.int(0, THEMES.length - 1);
  // multisets(items, bins) = C(items + bins − 1, bins − 1); picks are the items
  // and kinds are the bins, so multisets(k, n) = C(k + n − 1, n − 1).
  return { params: { n, k, theme }, answer: multisets(k, n) };
}

function MultisetQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);
  const theme = THEMES[Number(question.params.theme)] ?? THEMES[0];
  const top = k + n - 1;

  const fields: FormulaField[] = [
    { key: "top", label: "multiset first part", expected: top, boxId: "mult-top" },
    { key: "bottom", label: "multiset second part", expected: n - 1, boxId: "mult-bottom" },
    { key: "res", label: "multiset result", expected: answer, boxId: "mult-res", width: "w-20" },
  ];
  const boxes = multisetBoxes({
    n,
    k,
    answer,
    pick: theme.pick,
    kind: theme.kind,
    params: question.params,
  });

  const prompt = (
    <>
      You fill a {theme.container} with <b>{k}</b> {theme.pick} chosen from{" "}
      <b>{n}</b> {theme.kind}. Repeats are allowed and order doesn't matter. Fill
      in the count.
    </>
  );

  return (
    <QuestionShell tag="Order doesn't matter · reuse" prompt={prompt}>
      <p className="mt-4 text-[13px] text-stone-600">
        With <b>{n}</b> {theme.kind} (n) and <b>{k}</b> {theme.pick} (k), the
        count is <b>C(k + n − 1, n − 1)</b>.
      </p>
      <FormulaFill
        fields={fields}
        answer={answer}
        unit="ways"
        locked={locked}
        onResult={onResult}
        boxes={boxes}
        layout={(field) => (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl border-2 border-umber-100 bg-umber-50/40 p-5 text-2xl font-extrabold text-stone-700">
            <span>C(</span>
            {field("top")}
            <span>,</span>
            {field("bottom")}
            <span>) =</span>
            {field("res")}
          </div>
        )}
      />
    </QuestionShell>
  );
}

export const spec: QuizQuestionSpec = {
  id: "multiset",
  lessonId: "l5-choice-distribution",
  generate,
  Component: MultisetQuestion,
};

export default MultisetQuestion;
