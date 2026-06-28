import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { combinations, type Rng } from "../../rng";
import type { FormulaField } from "../shared";
import { FormulaUpgrade, SubtractUpgrade, box } from "./shared";

/**
 * Ant Army upgrade challenges for topic l4 (Combinations). Both are answered by
 * typing into a C()/equation template and move past the plain C(n,k) derivation:
 *  - worker -> warrior: a required member -> C(n-1, k-1).
 *  - warrior -> general: "at least one special" via complement counting.
 */

const NAMES = ["Maya", "Theo", "Ivy", "Rumi", "Otis"];

/* ------------------------------ required member (warrior) ----------------------------- */

function generateMust(rng: Rng): GeneratedQuestion {
  const n = rng.int(5, 9);
  const k = rng.int(2, 3);
  const who = rng.int(0, NAMES.length - 1);
  return { params: { n, k, who }, answer: combinations(n - 1, k - 1) };
}

function MustQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const who = NAMES[Number(question.params.who)] ?? NAMES[0];
  const answer = Number(question.answer);
  const a = n - 1; // {who} is already on the team
  const b = k - 1; // one seat is taken

  const fields: FormulaField[] = [
    { key: "n", label: "people remaining", expected: a, boxId: "combM-n" },
    { key: "k", label: "spots remaining", expected: b, boxId: "combM-k" },
    { key: "res", label: "teams", expected: answer, boxId: "combM-res", width: "w-20" },
  ];
  const boxes = {
    n: box(
      "combM-n",
      "People left to choose from",
      `${who} is already on the team, so n − 1 = ${a} people remain.`,
    ),
    k: box(
      "combM-k",
      "Spots left to fill",
      `${who} takes one spot, leaving k − 1 = ${b} to choose.`,
    ),
    res: box(
      "combM-res",
      "Combination count",
      `C(${a}, ${b}) = ${answer.toLocaleString()} teams.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="Choose · required member"
      prompt={
        <>
          You are choosing a <b>{k}</b>-person team from <b>{n}</b> people, but{" "}
          <b>{who}</b> must be on the team. Fill in the combination of the
          remaining choices.
        </>
      }
      fields={fields}
      answer={answer}
      unit="teams"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
          <span>C(</span>
          {field("n")}
          <span>,</span>
          {field("k")}
          <span>) =</span>
          {field("res")}
        </div>
      )}
    />
  );
}

export const combMustSpec: QuizQuestionSpec = {
  id: "comb-must",
  lessonId: "l4-comb-no-rep",
  generate: generateMust,
  Component: MustQuestion,
};

/* ------------------------------ at least one (general) ----------------------------- */

function generateAtLeast(rng: Rng): GeneratedQuestion {
  const n = rng.int(6, 9);
  const k = 3;
  const m = rng.int(2, 3); // number of "special" members
  const total = combinations(n, k);
  const none = combinations(n - m, k);
  return { params: { n, k, m, total, none }, answer: total - none };
}

function AtLeastQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const m = Number(question.params.m);
  const total = Number(question.params.total);
  const none = Number(question.params.none);
  return (
    <SubtractUpgrade
      tag="Choose · at least one"
      prompt={
        <>
          A panel of <b>{n}</b> people includes <b>{m}</b> experts. How many ways
          can you choose <b>{k}</b> people so that <b>at least one</b> is an
          expert? <i>Hint: all choices minus the expert-free ones.</i>
        </>
      }
      unit="ways"
      total={total}
      removed={none}
      totalExpr={`C(${n}, ${k})`}
      removedExpr={`C(${n - m}, ${k})`}
      totalText={`All ways to choose ${k} of ${n}: C(${n}, ${k}) = ${total.toLocaleString()}.`}
      removedText={`Expert-free choices pick ${k} from the ${n - m} non-experts: C(${n - m}, ${k}) = ${none.toLocaleString()}.`}
      removedTitle="expert-free choices"
      locked={locked}
      onResult={onResult}
    />
  );
}

export const combAtLeastSpec: QuizQuestionSpec = {
  id: "comb-atleast",
  lessonId: "l4-comb-no-rep",
  generate: generateAtLeast,
  Component: AtLeastQuestion,
};
