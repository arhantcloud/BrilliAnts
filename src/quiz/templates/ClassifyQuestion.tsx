import { useState } from "react";
import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import type { Rng } from "../rng";
import { Feedback, QuestionShell } from "./shared";
import { useMascotOptional } from "../../mascot/mascot-context";
import type { AntStop } from "../../mascot/mascot-context";
import { classifyBoxes } from "../../mascot/boxExplanations";

/**
 * Lesson 1: the two questions: classify a scenario into one of the four
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
 * to infer the order/reuse structure rather than read it off the prompt, with no
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
  boxId,
  wrong = false,
  corrected = false,
}: {
  label: string;
  value: boolean | null;
  disabled: boolean;
  onChange: (next: boolean) => void;
  boxId?: string;
  wrong?: boolean;
  corrected?: boolean;
}) {
  const options: { text: string; on: boolean }[] = [
    { text: "Yes", on: true },
    { text: "No", on: false },
  ];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold text-stone-700">{label}</span>
      <div
        role="group"
        aria-label={label}
        data-ant-box={boxId}
        className={`inline-flex shrink-0 rounded-xl bg-stone-100 p-1 ${
          corrected ? "ring-2 ring-lime-400" : wrong ? "ring-2 ring-red-300" : ""
        }`}
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
                  ? corrected
                    ? "bg-lime-600 text-white shadow-sm"
                    : "bg-umber-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700 disabled:hover:text-stone-500"
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
  const mascot = useMascotOptional();
  const [orderMatters, setOrderMatters] = useState<boolean | null>(null);
  const [canRepeat, setCanRepeat] = useState<boolean | null>(null);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [corrected, setCorrected] = useState<Set<string>>(() => new Set());
  const markCorrected = (id: string) =>
    setCorrected((prev) => new Set(prev).add(id));

  const answer = String(question.answer) as CellId;
  const prompt = String(question.params.prompt);
  const isLocked = locked || submitted;
  const ready =
    orderMatters !== null && canRepeat !== null && guess.trim().length > 0;

  const expectedOrder = answer === "permutations" || answer === "sequences";
  const expectedRepeat = answer === "sequences" || answer === "multisets";
  const orderWrong = submitted && orderMatters !== expectedOrder;
  const repeatWrong = submitted && canRepeat !== expectedRepeat;

  function isCorrect() {
    if (orderMatters === null || canRepeat === null) return false;
    return (
      quadrant(orderMatters, canRepeat) === answer && resolve(guess) === answer
    );
  }
  const correct = submitted && isCorrect();

  function submit() {
    if (isLocked || !ready) return;
    const right = isCorrect();
    setSubmitted(true);
    onResult(right);
    if (!right) {
      const boxes = classifyBoxes(answer, question.params);
      const stops: AntStop[] = [];
      if (orderMatters !== expectedOrder)
        stops.push({
          ...boxes.order,
          fix: () => {
            setOrderMatters(expectedOrder);
            markCorrected("classify-order");
          },
        });
      if (canRepeat !== expectedRepeat)
        stops.push({
          ...boxes.repeat,
          fix: () => {
            setCanRepeat(expectedRepeat);
            markCorrected("classify-repeat");
          },
        });
      if (resolve(guess) !== answer)
        stops.push({
          ...boxes.name,
          fix: () => {
            setGuess(NAMES[answer]);
            markCorrected("classify-name");
          },
        });
      mascot?.reviewBoxes(stops);
    }
  }

  return (
    <QuestionShell
      tag="Which kind of counting?"
      prompt={
        <>
          {prompt}
          <span className="mt-2 block text-[13px] text-stone-500">
            Decide the two structure questions, then name the counting category.
          </span>
        </>
      }
    >
      <div className="mt-5 space-y-3 rounded-2xl border-2 border-stone-200 bg-white p-4">
        <DecisionSwitch
          label="Does order matter?"
          value={orderMatters}
          disabled={isLocked}
          onChange={setOrderMatters}
          boxId="classify-order"
          wrong={orderWrong}
          corrected={corrected.has("classify-order")}
        />
        <DecisionSwitch
          label="Can items repeat?"
          value={canRepeat}
          disabled={isLocked}
          onChange={setCanRepeat}
          boxId="classify-repeat"
          wrong={repeatWrong}
          corrected={corrected.has("classify-repeat")}
        />
      </div>

      <div className="mt-4">
        <input
          type="text"
          aria-label="Category name"
          data-ant-box="classify-name"
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
          className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-[15px] font-semibold text-stone-700 outline-none transition placeholder:font-normal placeholder:text-stone-400 focus:border-umber-500 focus:ring-2 focus:ring-umber-200 ${
            corrected.has("classify-name")
              ? "border-lime-400 bg-lime-50 text-lime-700 disabled:bg-lime-50 disabled:text-lime-700"
              : submitted
                ? correct
                  ? "border-emerald-300 disabled:bg-stone-50 disabled:text-stone-400"
                  : "border-red-300 disabled:bg-stone-50 disabled:text-stone-400"
                : "border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
          }`}
        />
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={!ready}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
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
