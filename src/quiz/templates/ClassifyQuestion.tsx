import { useState } from "react";
import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import type { Rng } from "../rng";
import { Feedback, QuestionShell } from "./shared";

/**
 * Lesson 1 — the two questions: classify a scenario into one of the four
 * counting worlds. The learner answers TWO ways and both must agree: they set
 * the two binary toggles (does order matter? / can items repeat?) AND type the
 * name of the matching category. The answer is a category key.
 */

type CellId = "permutations" | "sequences" | "combinations" | "multisets";

/**
 * Map the two binary decisions to the counting world they define:
 *   order matters + no reuse  → permutations
 *   order matters + reuse     → sequences
 *   order ignored + no reuse  → combinations
 *   order ignored + reuse     → multisets
 */
function quadrant(orderMatters: boolean, canRepeat: boolean): CellId {
  if (orderMatters) return canRepeat ? "sequences" : "permutations";
  return canRepeat ? "multisets" : "combinations";
}

const NAMES: Record<CellId, string> = {
  permutations: "Permutations",
  sequences: "Sequences",
  combinations: "Combinations",
  multisets: "Multisets",
};

/**
 * Accepted typed forms → category key. Forgiving on purpose: input is trimmed
 * and lower-cased before lookup, and both singular and plural spellings count.
 */
const ALIASES: Record<string, CellId> = {
  permutation: "permutations",
  permutations: "permutations",
  sequence: "sequences",
  sequences: "sequences",
  combination: "combinations",
  combinations: "combinations",
  multiset: "multisets",
  multisets: "multisets",
};

/** Resolve a raw typed guess to a category key, or null if unrecognized. */
function resolve(raw: string): CellId | null {
  return ALIASES[raw.trim().toLowerCase()] ?? null;
}

type Scenario = {
  cell: CellId;
  build: (n: number, k: number) => string;
};

/**
 * Each scenario maps to exactly one category, but is phrased so the learner has
 * to infer the order/reuse structure rather than read it off the prompt — no
 * "order", "repeat", or "different" giveaways.
 */
const SCENARIOS: Scenario[] = [
  {
    // permutations: distinct people, distinct ranked prizes → order matters, no reuse
    cell: "permutations",
    build: (n, k) =>
      `Awarding gold, silver, and bronze medals to ${k} of ${n} sprinters.`,
  },
  {
    // permutations: numbered chairs distinguish positions; one guest per chair
    cell: "permutations",
    build: (n, k) => `Seating ${k} of ${n} guests in ${k} numbered chairs.`,
  },
  {
    // sequences: each slot independently drawn from n symbols → order matters, reuse ok
    cell: "sequences",
    build: (n, k) =>
      `A ${k}-character password where each character is one of ${n} symbols.`,
  },
  {
    // sequences: successive rolls are distinguishable; values can recur
    cell: "sequences",
    build: (n, k) =>
      `Rolling an ${n}-sided die ${k} times and recording what each roll shows.`,
  },
  {
    // combinations: a team has no internal ranking; a person can't be on it twice
    cell: "combinations",
    build: (n, k) => `Choosing a ${k}-person team from ${n} players.`,
  },
  {
    // combinations: a topping list isn't ranked; a topping appears at most once
    cell: "combinations",
    build: (n, k) => `Picking ${k} pizza toppings from a menu of ${n}.`,
  },
  {
    // multisets: scoops sit in a bowl (no ranking) and flavors can recur
    cell: "multisets",
    build: (n, k) => `Filling a bowl with ${k} scoops chosen from ${n} ice-cream flavors.`,
  },
  {
    // multisets: candies in a bag aren't ranked and flavors can recur
    cell: "multisets",
    build: (n, k) => `Dropping ${k} candies into a goodie bag from ${n} flavors at the counter.`,
  },
];

function generate(rng: Rng): GeneratedQuestion {
  const idx = rng.int(0, SCENARIOS.length - 1);
  const scenario = SCENARIOS[idx];
  const n = rng.int(4, 9);
  const k = rng.int(2, 3);
  return {
    params: { scenario: idx, n, k, prompt: scenario.build(n, k) },
    answer: scenario.cell,
  };
}

/**
 * A single binary decision rendered as a two-option segmented toggle. Starts
 * unset (neither side chosen) so the control never hints at the answer; once
 * the question is locked it freezes on the learner's pick.
 */
function DecisionSwitch({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean | null;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  const options: { text: string; on: boolean }[] = [
    { text: "Yes", on: true },
    { text: "No", on: false },
  ];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold text-slate-700">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex shrink-0 rounded-xl bg-slate-100 p-1"
      >
        {options.map((opt) => {
          const selected = value === opt.on;
          return (
            <button
              key={opt.text}
              type="button"
              aria-label={`${label} ${opt.text}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(opt.on)}
              className={`min-w-[3.5rem] rounded-lg px-3 py-1.5 text-[13px] font-bold transition active:scale-95 disabled:active:scale-100 ${
                selected
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 disabled:hover:text-slate-500"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClassifyQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const [orderMatters, setOrderMatters] = useState<boolean | null>(null);
  const [canRepeat, setCanRepeat] = useState<boolean | null>(null);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const answer = String(question.answer) as CellId;
  const prompt = String(question.params.prompt);
  const isLocked = locked || submitted;
  const ready =
    orderMatters !== null && canRepeat !== null && guess.trim().length > 0;

  function isCorrect() {
    if (orderMatters === null || canRepeat === null) return false;
    return (
      quadrant(orderMatters, canRepeat) === answer && resolve(guess) === answer
    );
  }
  const correct = submitted && isCorrect();

  function submit() {
    if (isLocked || !ready) return;
    setSubmitted(true);
    onResult(isCorrect());
  }

  return (
    <QuestionShell
      tag="Which kind of counting?"
      prompt={
        <>
          {prompt}
          <span className="mt-2 block text-[13px] text-slate-500">
            Decide the two structure questions, then name the counting category.
          </span>
        </>
      }
    >
      <div className="mt-5 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
        <DecisionSwitch
          label="Does order matter?"
          value={orderMatters}
          disabled={isLocked}
          onChange={setOrderMatters}
        />
        <DecisionSwitch
          label="Can items repeat?"
          value={canRepeat}
          disabled={isLocked}
          onChange={setCanRepeat}
        />
      </div>

      <div className="mt-4">
        <input
          type="text"
          aria-label="Category name"
          value={guess}
          disabled={isLocked}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. Permutations, Sequences, Combinations, Multisets"
          className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-[15px] font-semibold text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-slate-50 disabled:text-slate-400 ${
            submitted
              ? correct
                ? "border-emerald-300"
                : "border-red-300"
              : "border-slate-200"
          }`}
        />
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={!ready}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Submit
        </button>
      ) : (
        <Feedback correct={correct} answer={NAMES[answer]} />
      )}
    </QuestionShell>
  );
}

export const spec: QuizQuestionSpec = {
  id: "classify",
  lessonId: "l1-two-questions",
  generate,
  Component: ClassifyQuestion,
};

export default ClassifyQuestion;
