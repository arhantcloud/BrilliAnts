import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { multisets, type Rng } from "../rng";
import { FormulaFill, QuestionShell, type FormulaField } from "./shared";
import { distributeBoxes } from "../../mascot/boxExplanations";

/**
 * Lesson 6: choosing = distributing.
 *
 * Inspired by the lesson's "two languages, one map" idea: distributing `items`
 * identical objects into `bins` distinct bins is counted by the multiset formula
 * C(items + bins − 1, bins − 1). Uses the same fill-the-formula interaction as
 * the other quizzes, the learner fills the combination arguments (framed as
 * dividers between bins) and the result. No dial, no card matching.
 */

type Theme = { item: string; bin: string };

const THEMES: Theme[] = [
  { item: "identical marbles", bin: "jars" },
  { item: "identical coins", bin: "piggy banks" },
  { item: "identical stickers", bin: "notebooks" },
  { item: "identical candies", bin: "party bags" },
];

/** items identical objects into bins distinct bins = C(items + bins − 1, bins − 1). */
function generate(rng: Rng): GeneratedQuestion {
  const items = rng.int(3, 6);
  const bins = rng.int(2, 4);
  const theme = rng.int(0, THEMES.length - 1);
  return { params: { items, bins, theme }, answer: multisets(items, bins) };
}

function DistributeQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const items = Number(question.params.items);
  const bins = Number(question.params.bins);
  const answer = Number(question.answer);
  const theme = THEMES[Number(question.params.theme)] ?? THEMES[0];
  const top = items + bins - 1;
  const bottom = bins - 1;

  const fields: FormulaField[] = [
    { key: "top", label: "distribute first part", expected: top, boxId: "dist-top" },
    { key: "bottom", label: "distribute second part", expected: bottom, boxId: "dist-bottom" },
    { key: "res", label: "distribute result", expected: answer, boxId: "dist-res", width: "w-20" },
  ];
  const boxes = distributeBoxes({
    items,
    bins,
    answer,
    item: theme.item,
    bin: theme.bin,
    params: question.params,
  });

  const prompt = (
    <>
      You distribute <b>{items}</b> {theme.item} among <b>{bins}</b> distinct{" "}
      {theme.bin} (a bin may get none). Fill in the count.
    </>
  );

  return (
    <QuestionShell tag="Choosing = distributing" prompt={prompt}>
      <p className="mt-4 text-[13px] text-stone-600">
        Distributing into bins is the same as choosing with repeats: with{" "}
        <b>{items}</b> items and <b>{bins}</b> bins, the count is{" "}
        <b>C(items + bins − 1, bins − 1)</b>.
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
  id: "distribute",
  lessonId: "l6-choose-distribute",
  generate,
  Component: DistributeQuestion,
};

export default DistributeQuestion;
