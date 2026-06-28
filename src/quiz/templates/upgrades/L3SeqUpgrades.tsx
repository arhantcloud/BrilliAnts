import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { power, type Rng } from "../../rng";
import type { FormulaField } from "../shared";
import { FormulaUpgrade, SubtractUpgrade, box } from "./shared";

/**
 * Ant Army upgrade challenges for topic l3 (Sequences, n^k). Both are answered
 * by typing into an equation template and go beyond the plain "n to the k":
 *  - worker -> warrior: a first-position restriction -> (s-1) * s^(L-1).
 *  - warrior -> general: "uses symbol X at least once" via complement counting.
 */

const ALPHABETS = [
  { kind: "colour", symbols: "colours", first: "the colour red" },
  { kind: "letter", symbols: "letters", first: "a vowel" },
  { kind: "shape", symbols: "shapes", first: "a star" },
];

/* --------------------------- first-symbol rule (warrior) -------------------------- */

function generateConstraint(rng: Rng): GeneratedQuestion {
  const s = rng.int(3, 5);
  const L = rng.int(2, 3);
  const theme = rng.int(0, ALPHABETS.length - 1);
  return { params: { s, L, theme }, answer: (s - 1) * power(s, L - 1) };
}

function ConstraintQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const s = Number(question.params.s);
  const L = Number(question.params.L);
  const t = ALPHABETS[Number(question.params.theme)] ?? ALPHABETS[0];
  const answer = Number(question.answer);
  const first = s - 1; // first slot can't be the forbidden symbol
  const exp = L - 1; // free slots after the first

  const fields: FormulaField[] = [
    { key: "first", label: "first-slot choices", expected: first, boxId: "seqC-first" },
    { key: "base", label: "choices per later slot", expected: s, boxId: "seqC-base" },
    { key: "exp", label: "later slots", expected: exp, boxId: "seqC-exp" },
    { key: "res", label: "patterns", expected: answer, boxId: "seqC-res", width: "w-20" },
  ];
  const boxes = {
    first: box(
      "seqC-first",
      "First slot",
      `The first slot can't be ${t.first}, so s − 1 = ${first} choices there.`,
    ),
    base: box(
      "seqC-base",
      "Each later slot",
      `Every later slot is free: all s = ${s} ${t.symbols}.`,
    ),
    exp: box(
      "seqC-exp",
      "How many later slots",
      `After the first slot, L − 1 = ${exp} slots remain.`,
    ),
    res: box(
      "seqC-res",
      "Multiply it out",
      `(s − 1) · s^(L − 1) = ${first} · ${s}^${exp} = ${answer.toLocaleString()} patterns.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="Order matters · restriction"
      prompt={
        <>
          A pattern has <b>{L}</b> slots, and each slot can be any of <b>{s}</b>{" "}
          {t.symbols} (repeats allowed). But the <b>first</b> slot cannot be{" "}
          <b>{t.first}</b>. Fill in the equation for the number of patterns.
        </>
      }
      fields={fields}
      answer={answer}
      unit="patterns"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
          {field("first")}
          <span>×</span>
          {field("base")}
          <span className="self-start text-base">^</span>
          {field("exp")}
          <span>=</span>
          {field("res")}
        </div>
      )}
    />
  );
}

export const seqConstraintSpec: QuizQuestionSpec = {
  id: "seq-constraint",
  lessonId: "l3-order-rep",
  generate: generateConstraint,
  Component: ConstraintQuestion,
};

/* --------------------------- at least once (general) ---------------------------- */

function generateAtLeastOne(rng: Rng): GeneratedQuestion {
  const s = rng.int(2, 4);
  const L = rng.int(2, 3);
  const total = power(s, L);
  const none = power(s - 1, L);
  return { params: { s, L, total, none }, answer: total - none };
}

function AtLeastOneQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const s = Number(question.params.s);
  const L = Number(question.params.L);
  const total = Number(question.params.total);
  const none = Number(question.params.none);
  return (
    <SubtractUpgrade
      tag="Order matters · at least one"
      prompt={
        <>
          How many length-<b>{L}</b> strings over <b>{s}</b> symbols use a{" "}
          specific symbol <b>at least once</b>?{" "}
          <i>Hint: count all strings, then subtract those that avoid it.</i>
        </>
      }
      unit="strings"
      total={total}
      removed={none}
      totalExpr={`${s}^${L}`}
      removedExpr={`${s - 1}^${L}`}
      totalText={`Every slot is free: s^L = ${s}^${L} = ${total.toLocaleString()} strings.`}
      removedText={`Strings that avoid the symbol use only s − 1 = ${s - 1} symbols: ${s - 1}^${L} = ${none.toLocaleString()}.`}
      removedTitle="symbol-free strings"
      locked={locked}
      onResult={onResult}
    />
  );
}

export const seqAtLeastOneSpec: QuizQuestionSpec = {
  id: "seq-atleastone",
  lessonId: "l3-order-rep",
  generate: generateAtLeastOne,
  Component: AtLeastOneQuestion,
};
