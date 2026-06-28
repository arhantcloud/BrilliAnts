import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { combinations, multisets, type Rng } from "../../rng";
import type { FormulaField } from "../shared";
import { FormulaUpgrade, SubtractUpgrade, StarsAndBars, box } from "./shared";

/**
 * Ant Army upgrade challenges for topic l6 (Choosing = Distributing). Both are
 * answered by typing into a stars-and-bars C()/equation template:
 *  - worker -> warrior: each bin gets at least one -> C(items-1, bins-1).
 *  - warrior -> general: one bin is capped, via complement counting.
 */

const STORIES = [
  { item: "identical coins", bin: "piggy banks" },
  { item: "identical apples", bin: "baskets" },
  { item: "identical stickers", bin: "albums" },
];

/* ------------------------------- each at least one (warrior) ------------------------------- */

function generateFair(rng: Rng): GeneratedQuestion {
  const bins = rng.int(2, 4);
  const items = rng.int(bins + 2, 9); // ensure items > bins so every bin can get >= 1
  const story = rng.int(0, STORIES.length - 1);
  return {
    params: { items, bins, story },
    answer: combinations(items - 1, bins - 1),
  };
}

function FairQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const items = Number(question.params.items);
  const bins = Number(question.params.bins);
  const st = STORIES[Number(question.params.story)] ?? STORIES[0];
  const answer = Number(question.answer);
  const a = items - 1; // gaps between the lined-up items
  const b = bins - 1; // dividers to drop into the gaps

  const fields: FormulaField[] = [
    { key: "n", label: "gaps", expected: a, boxId: "distFair-n" },
    { key: "k", label: "dividers", expected: b, boxId: "distFair-k" },
    { key: "res", label: "ways", expected: answer, boxId: "distFair-res", width: "w-20" },
  ];
  const boxes = {
    n: box(
      "distFair-n",
      "Gaps between items",
      `Line up the ${items} ${st.item}; there are items − 1 = ${a} gaps between them.`,
    ),
    k: box(
      "distFair-k",
      "Dividers to place",
      `Drop bins − 1 = ${b} dividers into the gaps so every ${st.bin.replace(/s$/, "")} gets at least one.`,
    ),
    res: box(
      "distFair-res",
      "Combination count",
      `C(${a}, ${b}) = ${answer.toLocaleString()} ways.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="Distribute · each at least one"
      prompt={
        <>
          You split <b>{items}</b> {st.item} among <b>{bins}</b> {st.bin}, and
          every {st.bin.replace(/s$/, "")} must get <b>at least one</b>. Fill in
          the combination.{" "}
          <i>Hint: give one to each first, then share out the rest.</i>
        </>
      }
      fields={fields}
      answer={answer}
      unit="ways"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5">
          <StarsAndBars stars={items} bars={bins - 1} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
            <span>C(</span>
            {field("n")}
            <span>,</span>
            {field("k")}
            <span>) =</span>
            {field("res")}
          </div>
        </div>
      )}
    />
  );
}

export const distFairSpec: QuizQuestionSpec = {
  id: "dist-fair",
  lessonId: "l6-choose-distribute",
  generate: generateFair,
  Component: FairQuestion,
};

/* --------------------------------- capped bin (general) --------------------------------- */

function generateCapped(rng: Rng): GeneratedQuestion {
  const bins = rng.int(2, 3);
  const items = rng.int(4, 7);
  const c = rng.int(1, 2);
  const total = multisets(items, bins);
  const over = items - (c + 1) >= 0 ? multisets(items - (c + 1), bins) : 0;
  return { params: { items, bins, c, total, over }, answer: total - over };
}

function CappedQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const items = Number(question.params.items);
  const bins = Number(question.params.bins);
  const c = Number(question.params.c);
  const total = Number(question.params.total);
  const over = Number(question.params.over);
  const ir = items - (c + 1); // tokens left after overfilling the first box

  return (
    <SubtractUpgrade
      tag="Distribute · capped bin"
      prompt={
        <>
          You hand out <b>{items}</b> identical tokens among <b>{bins}</b> boxes
          (a box may get none), but the first box can hold <b>at most {c}</b>. How
          many ways are there? <i>Hint: all ways minus those that overfill it.</i>
        </>
      }
      unit="ways"
      total={total}
      removed={over}
      totalExpr={`C(${items + bins - 1}, ${bins - 1})`}
      removedExpr={`C(${ir + bins - 1}, ${bins - 1})`}
      totalText={`All ways to hand out ${items} tokens into ${bins} boxes: ${total.toLocaleString()}.`}
      removedText={`Over-cap ways force ${c + 1} into the first box, then hand out the remaining ${ir}: ${over.toLocaleString()}.`}
      removedTitle="over-the-cap ways"
      locked={locked}
      onResult={onResult}
    />
  );
}

export const distCappedSpec: QuizQuestionSpec = {
  id: "dist-capped",
  lessonId: "l6-choose-distribute",
  generate: generateCapped,
  Component: CappedQuestion,
};
