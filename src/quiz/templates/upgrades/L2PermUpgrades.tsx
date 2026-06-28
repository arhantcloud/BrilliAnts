import type { GeneratedQuestion } from "../../../types";
import type {
  QuizQuestionSpec,
  QuizQuestionViewProps,
} from "../../QuizQuestionSpec";
import { circular, permutations, type Rng } from "../../rng";
import type { FormulaField } from "../shared";
import { FormulaUpgrade, box } from "./shared";

/**
 * Ant Army upgrade challenges for topic l2 (Permutations). Both are answered by
 * typing into a P()/factorial template and add a twist the base quiz never does:
 *  - worker -> warrior: a fixed-position restriction (one runner must be first).
 *  - warrior -> general: circular permutations around a round table = (n-1)!.
 */

/* --------------------------- restricted lineup (warrior) -------------------------- */

const CAPTAINS = ["Ada", "Bo", "Cy", "Dee", "Eli"];

function generateRestricted(rng: Rng): GeneratedQuestion {
  const n = rng.int(5, 7);
  const k = rng.int(2, 3);
  const captain = rng.int(0, CAPTAINS.length - 1);
  // Captain is locked into the first slot; fill the rest from the others.
  return {
    params: { n, k, captain },
    answer: permutations(n - 1, k - 1),
  };
}

function LineupVisual({ k }: { k: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: k }, (_, i) => (
        <div
          key={i}
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg font-extrabold ${
            i === 0
              ? "bg-amber-400 text-amber-900"
              : "bg-stone-200 text-stone-400"
          }`}
        >
          {i === 0 ? "★" : "?"}
        </div>
      ))}
    </div>
  );
}

function RestrictedQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const captain = CAPTAINS[Number(question.params.captain)] ?? CAPTAINS[0];
  const answer = Number(question.answer);
  const a = n - 1; // runners left after the captain takes slot 1
  const b = k - 1; // slots left to fill in order

  const fields: FormulaField[] = [
    { key: "n", label: "runners remaining", expected: a, boxId: "permR-n" },
    { key: "k", label: "slots remaining", expected: b, boxId: "permR-k" },
    { key: "res", label: "lineups", expected: answer, boxId: "permR-res", width: "w-20" },
  ];
  const boxes = {
    n: box(
      "permR-n",
      "Runners left to place",
      `Captain ${captain} is locked into slot 1, so n − 1 = ${a} runners remain.`,
    ),
    k: box(
      "permR-k",
      "Slots left to fill",
      `The captain already fills the first slot, leaving k − 1 = ${b} slots to fill in order.`,
    ),
    res: box(
      "permR-res",
      "Permutation count",
      `P(${a}, ${b}) = ${answer.toLocaleString()} lineups.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="Order matters · restriction"
      prompt={
        <>
          <b>{k}</b> of <b>{n}</b> runners line up to start the relay, but team
          captain <b>{captain}</b> must run in the <b>first</b> position. Fill in
          the permutation of the remaining runners.
        </>
      }
      fields={fields}
      answer={answer}
      unit="lineups"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5">
          <LineupVisual k={k} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
            <span>P(</span>
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

export const permRestrictedSpec: QuizQuestionSpec = {
  id: "perm-restricted",
  lessonId: "l2-perm-no-rep",
  generate: generateRestricted,
  Component: RestrictedQuestion,
};

/* ---------------------------- round table (general) ----------------------------- */

function generateCircular(rng: Rng): GeneratedQuestion {
  const n = rng.int(4, 6);
  return { params: { n }, answer: circular(n) };
}

function RoundTable({ n }: { n: number }) {
  const r = 34;
  const cx = 50;
  const cy = 50;
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-28 w-28" aria-hidden>
      <circle cx={cx} cy={cy} r={r - 12} fill="#e6ddd5" stroke="#ad9588" strokeWidth="2" />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * r}
            cy={cy + Math.sin(a) * r}
            r="6"
            fill="#a44a26"
          />
        );
      })}
    </svg>
  );
}

function CircularQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const answer = Number(question.answer);
  const a = n - 1; // fix one seat to remove rotations

  const fields: FormulaField[] = [
    { key: "base", label: "friends to arrange", expected: a, boxId: "permC-base" },
    { key: "res", label: "seatings", expected: answer, boxId: "permC-res", width: "w-20" },
  ];
  const boxes = {
    base: box(
      "permC-base",
      "Fix one seat",
      `Seat one friend to kill rotations, leaving n − 1 = ${a} others to arrange.`,
    ),
    res: box(
      "permC-res",
      "Factorial",
      `(n − 1)! = ${a}! = ${answer.toLocaleString()} seatings.`,
    ),
  };

  return (
    <FormulaUpgrade
      tag="Order matters · circular"
      prompt={
        <>
          <b>{n}</b> friends sit around a <b>round</b> table. Two seatings count as
          the same if one is a rotation of the other. Fill in the factorial of the
          remaining friends.
        </>
      }
      fields={fields}
      answer={answer}
      unit="seatings"
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5">
          <RoundTable n={n} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
            <span>(</span>
            {field("base")}
            <span>)! =</span>
            {field("res")}
          </div>
        </div>
      )}
    />
  );
}

export const permCircularSpec: QuizQuestionSpec = {
  id: "perm-circular",
  lessonId: "l2-perm-no-rep",
  generate: generateCircular,
  Component: CircularQuestion,
};
