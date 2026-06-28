import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { multisets, type Rng } from "../../rng";
import type { FormulaField } from "../shared";
import { FormulaUpgrade, SubtractUpgrade, StarsAndBars, box } from "./shared";

/**
 * Ant Army upgrade challenges for topic l5 (Multisets). Both are answered by
 * typing into a stars-and-bars C()/equation template:
 *  - worker -> warrior: "at least one of a kind" -> reserve one, then C(n + (k-1) - 1, k-1).
 *  - warrior -> general: "at most c of a kind" via complement counting.
 */

const SHOPS = [
  { item: "scoops", kind: "flavors", one: "chocolate" },
  { item: "donuts", kind: "kinds", one: "glazed" },
  { item: "candies", kind: "types", one: "cherry" },
];

/* -------------------------------- at least one (warrior) -------------------------------- */

function generateMin(rng: Rng): GeneratedQuestion {
  const n = rng.int(3, 5); // kinds
  const k = rng.int(3, 5); // total chosen
  const shop = rng.int(0, SHOPS.length - 1);
  // Reserve one of the required kind, then freely choose the remaining k-1 from
  // the n kinds: a multiset of size (k-1) from n types = C(n + (k-1) - 1, n-1).
  return { params: { n, k, shop }, answer: multisets(k - 1, n) };
}

function MinQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const s = SHOPS[Number(question.params.shop)] ?? SHOPS[0];
  const answer = Number(question.answer);
  const stars = k - 1; // one is reserved; freely place the rest
  const bars = n - 1; // dividers between the n kinds
  const top = stars + bars; // total positions in the row

  const fields: FormulaField[] = [
    { key: "top", label: "stars plus bars", expected: top, boxId: "multiMin-top" },
    { key: "bot", label: "bars", expected: bars, boxId: "multiMin-bot" },
    { key: "res", label: "selections", expected: answer, boxId: "multiMin-res", width: "w-20" },
  ];
  const boxes = {
    top: box(
      "multiMin-top",
      "Stars + bars",
      `Set one ${s.one} aside, then place ${stars} more ${s.item} among ${n} ${s.kind}: ${stars} stars + ${bars} bars = ${top} positions.`,
    ),
    bot: box(
      "multiMin-bot",
      "Choose the bars",
      `Pick where the n − 1 = ${bars} dividers go.`,
    ),
    res: box(
      "multiMin-res",
      "Stars-and-bars count",
      `C(${top}, ${bars}) = ${answer.toLocaleString()} selections.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="No order · repeats · minimum"
      prompt={
        <>
          You pick <b>{k}</b> {s.item} from <b>{n}</b> {s.kind} (repeats allowed,
          order ignored), but at least <b>one</b> must be <b>{s.one}</b>. Fill in
          the stars-and-bars count.{" "}
          <i>Hint: set one {s.one} aside, then freely choose the rest.</i>
        </>
      }
      fields={fields}
      answer={answer}
      unit="selections"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5">
          <StarsAndBars stars={stars} bars={bars} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
            <span>C(</span>
            {field("top")}
            <span>,</span>
            {field("bot")}
            <span>) =</span>
            {field("res")}
          </div>
        </div>
      )}
    />
  );
}

export const multiMinSpec: QuizQuestionSpec = {
  id: "multi-min",
  lessonId: "l5-choice-distribution",
  generate: generateMin,
  Component: MinQuestion,
};

/* --------------------------------- at most c (general) --------------------------------- */

function generateBounded(rng: Rng): GeneratedQuestion {
  const n = rng.int(3, 4); // kinds
  const k = rng.int(4, 6); // total chosen
  const c = rng.int(1, 2); // cap on one kind
  // A multiset of size k from n kinds = C(k + n - 1, n - 1).
  const total = multisets(k, n);
  const over = k - (c + 1) >= 0 ? multisets(k - (c + 1), n) : 0;
  return { params: { n, k, c, total, over }, answer: total - over };
}

function BoundedQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const c = Number(question.params.c);
  const total = Number(question.params.total);
  const over = Number(question.params.over);
  const kr = k - (c + 1); // remaining after forcing the cap to break
  return (
    <SubtractUpgrade
      tag="No order · repeats · cap"
      prompt={
        <>
          You choose <b>{k}</b> items from <b>{n}</b> kinds (repeats allowed,
          order ignored), but you may take <b>at most {c}</b> of the first kind.
          How many selections are possible?{" "}
          <i>Hint: all selections minus those that break the cap.</i>
        </>
      }
      unit="selections"
      total={total}
      removed={over}
      totalExpr={`C(${k + n - 1}, ${n - 1})`}
      removedExpr={`C(${kr + n - 1}, ${n - 1})`}
      totalText={`All multiset selections of ${k} from ${n} kinds: C(${k + n - 1}, ${n - 1}) = ${total.toLocaleString()}.`}
      removedText={`To break the cap, pre-place ${c + 1} of the first kind, then freely choose the remaining ${kr}: C(${kr + n - 1}, ${n - 1}) = ${over.toLocaleString()}.`}
      removedTitle="over-the-cap selections"
      locked={locked}
      onResult={onResult}
    />
  );
}

export const multiBoundedSpec: QuizQuestionSpec = {
  id: "multi-bounded",
  lessonId: "l5-choice-distribution",
  generate: generateBounded,
  Component: BoundedQuestion,
};
