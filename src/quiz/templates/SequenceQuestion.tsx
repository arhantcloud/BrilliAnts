import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { power, type Rng } from "../rng";
import { FormulaFill, QuestionShell, type FormulaField } from "./shared";
import { sequenceBoxes } from "../../mascot/boxExplanations";

/**
 * Lesson 3: order matters, with reuse: nᵏ.
 *
 * Inspired by the lesson's "n to the k" idea (k independent positions, each with
 * the same n options). Uses the same fill-the-formula interaction as the
 * permutation/combination quizzes: the learner fills the base, the exponent, and
 * the resulting count, then submits. No dial, no scaffolding visual.
 */

type Theme = {
  /** The whole thing being built, e.g. "vault code". */
  thing: string;
  /** A single position, e.g. "wheel". */
  position: string;
  /** The repeated options, e.g. "symbols". */
  option: string;
};

const THEMES: Theme[] = [
  { thing: "vault code", position: "wheel", option: "symbols" },
  { thing: "keypad PIN", position: "slot", option: "digits" },
  { thing: "password", position: "character", option: "letters" },
  { thing: "lock combo", position: "dial", option: "icons" },
  { thing: "license plate", position: "spot", option: "characters" },
];

/** Pick a base/exponent whose nᵏ stays a reasonable, non-trivial number. */
function generate(rng: Rng): GeneratedQuestion {
  const k = rng.pick([2, 3]);
  const n = k === 3 ? rng.int(2, 8) : rng.int(4, 9); // 8..512 (k=3) or 16..81 (k=2)
  const theme = rng.int(0, THEMES.length - 1);
  return { params: { n, k, theme }, answer: power(n, k) };
}

function SequenceQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);
  const theme = THEMES[Number(question.params.theme)] ?? THEMES[0];

  const fields: FormulaField[] = [
    { key: "base", label: "sequence base", expected: n, boxId: "seq-base" },
    { key: "exp", label: "sequence exponent", expected: k, boxId: "seq-exp", width: "w-12" },
    { key: "res", label: "sequence result", expected: answer, boxId: "seq-res", width: "w-24" },
  ];
  const boxes = sequenceBoxes({
    n,
    k,
    answer,
    position: theme.position,
    option: theme.option,
    params: question.params,
  });

  const prompt = (
    <>
      A <b>{theme.thing}</b> has <b>{k}</b> {theme.position}
      {k === 1 ? "" : "s"}. Each one can be any of <b>{n}</b> {theme.option}, and
      they can repeat. Fill in the formula for how many are possible.
    </>
  );

  return (
    <QuestionShell tag="Order matters · reuse" prompt={prompt}>
      <p className="mt-4 text-[13px] text-stone-600">
        Each of the <b>{k}</b> {theme.position}s is one of <b>{n}</b> options, so
        the count is n to the power k.
      </p>
      <FormulaFill
        fields={fields}
        answer={answer}
        unit="outcomes"
        locked={locked}
        onResult={onResult}
        boxes={boxes}
        layout={(field) => (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl border-2 border-umber-100 bg-umber-50/40 p-5 text-2xl font-extrabold text-stone-700">
            {field("base")}
            <span className="self-start pt-1 text-base text-stone-400">^</span>
            <span className="self-start">{field("exp")}</span>
            <span>=</span>
            {field("res")}
          </div>
        )}
      />
    </QuestionShell>
  );
}

export const spec: QuizQuestionSpec = {
  id: "sequence",
  lessonId: "l3-order-rep",
  generate,
  Component: SequenceQuestion,
};

export default SequenceQuestion;
