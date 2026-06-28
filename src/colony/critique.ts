import { getTemplate } from "../quiz/registry";
import {
  combinations,
  createRng,
  factorial,
  permutations,
  power,
  type Rng,
} from "../quiz/rng";
import { describeProblem } from "./problemType";
import type { GeneratedQuestion, Mistake } from "../types";

/**
 * OpenAI access for the Ant Colony "Spot the Slip" critique.
 *
 * WARNING: same exposure as src/colony/tutor.ts — the key is read from
 * `VITE_OPENAI_API_KEY`, which Vite inlines into the shipped bundle, so it is
 * PUBLICLY EXTRACTABLE from the deployed site. Use a usage-capped / restricted
 * key and rotate it if it leaks. The secure fix is a server-side proxy.
 */
const OPENAI_API_KEY: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

/** Whether the critique can call OpenAI (true only in local dev with a key). */
export function isCritiqueAiEnabled(): boolean {
  return typeof OPENAI_API_KEY === "string" && OPENAI_API_KEY.length > 0;
}

/** A concrete missed question, resolved from a stored mistake (ant). */
export type MissedQuestion = {
  templateId: string;
  style?: number;
  /** Human-readable problem-type label (see describeProblem). */
  label: string;
  params: Record<string, number | string>;
  answer: number | string;
};

/** A wrong worked solution by a "rookie ant" for the learner to critique. */
export type ErroneousExample = {
  /** The problem statement the rookie ant attempted. */
  setup: string;
  /**
   * The rookie ant's step-by-step working. The method is correct EXCEPT for one
   * small, localized slip in a single step (see `wrongStepIndex`); every other
   * step is right, so the learner has to spot the one detailed mistake.
   */
  steps: string[];
  /** 0-based index of the single step that contains the slip. */
  wrongStepIndex: number;
  /** The wrong final result the rookie ant landed on. */
  wrongAnswer: string;
  /** The correct result, for the reveal / self-rate path. */
  correctAnswer: string;
  /** Short name of the misconception behind the slip. */
  misconception: string;
  /** The canonical "what went wrong" critique (shown when AI can't judge). */
  canonicalExplanation: string;
};

/** Verdict on the learner's typed explanation of the rookie ant's error. */
export type CritiqueJudgement = {
  satisfactory: boolean;
  /** One or two warm sentences reacting to what the learner wrote. */
  feedback: string;
};

/** A very short, reactive mini-lesson shown when an explanation falls short. */
export type MiniLesson = {
  /** Names the misconception in one line. */
  point: string;
  /** One corrected micro-step. */
  fix: string;
  /** A quick "now you try" nudge. */
  tryThis: string;
};

/**
 * Resolve a stored mistake (ant) into a concrete question instance. Prefers the
 * exact missed question snapshot (`params`/`answer`) captured at quiz time, and
 * falls back to regenerating a fresh instance of the same template/style for
 * ants stored before that snapshot existed (mirrors ReviewSession.makeQuestions).
 */
export function resolveMissedQuestion(mistake: Mistake): MissedQuestion | null {
  const label = describeProblem(mistake);
  if (
    mistake.params &&
    typeof mistake.params === "object" &&
    mistake.answer !== undefined
  ) {
    return {
      templateId: mistake.templateId,
      style: mistake.style,
      label,
      params: mistake.params,
      answer: mistake.answer,
    };
  }

  const spec = getTemplate(mistake.templateId);
  if (!spec) return null;
  const rng: Rng = createRng();
  let q: GeneratedQuestion = spec.generate(rng);
  if (mistake.style !== undefined) {
    q = { ...q, params: { ...q.params, style: mistake.style } };
  }
  return {
    templateId: mistake.templateId,
    style: mistake.style,
    label,
    params: q.params,
    answer: q.answer,
  };
}

/* ----------------------------- authored examples ---------------------------- */

const num = (v: unknown): number => Number(v);

/** Properties of each "counting world" used by the classify type. */
const CELL_INFO: Record<
  string,
  { name: string; order: boolean; repeat: boolean }
> = {
  permutations: { name: "Permutations", order: true, repeat: false },
  sequences: { name: "Sequences", order: true, repeat: true },
  combinations: { name: "Combinations", order: false, repeat: false },
  multisets: { name: "Multisets", order: false, repeat: true },
};

/** Map the two yes/no classifiers to a counting world key. */
function quadrant(order: boolean, repeat: boolean): string {
  if (order) return repeat ? "sequences" : "permutations";
  return repeat ? "multisets" : "combinations";
}

/** Descending factors n, n-1, … (k of them), e.g. P(7,3) = [7, 6, 5]. */
function descending(n: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => n - i);
}

/**
 * The single source of truth for a "Spot the Slip" example. Encodes the ONE
 * fixed slip allowed per question type and computes the exact correct/wrong
 * numbers in code (the model never does arithmetic). Both the authored fallback
 * and the OpenAI prompt are built from these facts. Markdown is allowed in
 * `framing`, `steps`, and `canonicalExplanation`.
 */
type SlipFacts = {
  framing: string;
  /** One-line statement of the correct method (for the model + reveal). */
  method: string;
  /** The exact, single slip the rookie ant must make. */
  slipInstruction: string;
  misconception: string;
  correctAnswer: string;
  wrongAnswer: string;
  /** Authored markdown worked solution, exactly one step wrong. */
  steps: string[];
  /** 0-based index of the single wrong step. */
  wrongStepIndex: number;
  canonicalExplanation: string;
};

function slipFactsFor(q: MissedQuestion): SlipFacts {
  const p = q.params;
  switch (q.templateId) {
    case "permutation": {
      const n = num(p.n);
      const k = num(p.k);
      const right = permutations(n, k);
      const wrong = power(n, k); // pool never shrinks -> n^k
      const correctProduct = descending(n, k).join(" × ");
      const wrongProduct = Array(k).fill(n).join(" × ");
      return {
        framing: `Line up **${k}** of **${n}** distinct items in order, with no repeats.`,
        method: `Multiply a shrinking pool: ${correctProduct} = ${right}.`,
        slipInstruction: `keep the pool the SAME size on every pick (use ${n} every time) instead of shrinking it, so the product becomes ${wrongProduct} = ${n}^${k} = ${wrong}.`,
        misconception: "Pool didn't shrink — used n on every pick.",
        correctAnswer: String(right),
        wrongAnswer: String(wrong),
        steps: [
          `Order matters and there are no repeats, so multiply the options at each of the ${k} picks.`,
          `Each of the ${k} picks has **${n}** options.`,
          `Multiply: ${wrongProduct} = **${wrong}**.`,
        ],
        wrongStepIndex: 1,
        canonicalExplanation: `Each pick removes one option, so the pool shrinks: ${correctProduct} = **${right}**, not ${n}^${k} = ${wrong}.`,
      };
    }
    case "combination": {
      const n = num(p.n);
      const k = num(p.k);
      const right = combinations(n, k);
      const perm = permutations(n, k);
      const kf = factorial(k);
      // The mandated slip is "divide by k instead of k!", but that only changes
      // the answer when k! ≠ k (i.e. k ≥ 3). For k ≤ 2 it's a no-op (2! = 2), so
      // fall back to the equally-focused "forgot to divide by k! at all" slip so
      // the example always lands on a genuinely wrong answer.
      if (k >= 3) {
        const wrong = perm / k;
        return {
          framing: `Choose a group of **${k}** from **${n}**, where order doesn't matter.`,
          method: `Count ordered arrangements, then divide by ${k}!: ${perm} ÷ ${kf} = ${right}.`,
          slipInstruction: `divide the ${perm} ordered arrangements by ${k} instead of by ${k}! (which is ${kf}), giving ${perm} ÷ ${k} = ${wrong}.`,
          misconception: "Divided by k instead of k!.",
          correctAnswer: String(right),
          wrongAnswer: String(wrong),
          steps: [
            `Order doesn't matter, so count ordered arrangements, then divide out the repeats.`,
            `Ordered arrangements: ${descending(n, k).join(" × ")} = **${perm}**.`,
            `Each group of ${k} is counted ${k} times, so divide by **${k}**.`,
            `So: ${perm} ÷ ${k} = **${wrong}**.`,
          ],
          wrongStepIndex: 2,
          canonicalExplanation: `Each group of ${k} is counted ${k}! = **${kf}** times, so divide by ${kf}: ${perm} ÷ ${kf} = **${right}**.`,
        };
      }
      // For k = 2, "divide by k vs k!" is a no-op (2! = 2). Instead the rookie
      // over-counts the arrangements of the chosen pair as 2 × 2 = 4 and divides
      // by 4 instead of 2! = 2 — a focused, genuinely-wrong slip.
      const wrong = perm / 4;
      return {
        framing: `Choose a group of **${k}** from **${n}**, where order doesn't matter.`,
        method: `Count ordered arrangements, then divide by ${k}!: ${perm} ÷ ${kf} = ${right}.`,
        slipInstruction: `divide the ${perm} ordered arrangements by 4 instead of by ${k}! (which is ${kf}), giving ${perm} ÷ 4 = ${wrong}.`,
        misconception: "Divided by 4 instead of 2!.",
        correctAnswer: String(right),
        wrongAnswer: String(wrong),
        steps: [
          `Order doesn't matter, so count ordered arrangements, then divide out the repeats.`,
          `Ordered arrangements: ${descending(n, k).join(" × ")} = **${perm}**.`,
          `Each group of ${k} can be arranged 2 × 2 = 4 ways, so divide by **4**.`,
          `So: ${perm} ÷ 4 = **${wrong}**.`,
        ],
        wrongStepIndex: 2,
        canonicalExplanation: `A group of ${k} has only ${k}! = **${kf}** arrangements, so divide by ${kf}: ${perm} ÷ ${kf} = **${right}**.`,
      };
    }
    case "sequence": {
      const n = num(p.n);
      const k = num(p.k);
      const right = power(n, k);
      const swapped = power(k, n); // swapped base and exponent -> k^n
      // Swapping only changes the answer when n^k ≠ k^n (it ties when n === k, or
      // for the {2,4} pair). When it would be a no-op, fall back to the focused
      // "multiplied for one too few slots" slip so the answer is always wrong.
      if (swapped !== right) {
        return {
          framing: `Build a **${k}**-long sequence where each slot is one of **${n}** options (repeats allowed).`,
          method: `Options raised to the number of slots: ${n}^${k} = ${right}.`,
          slipInstruction: `swap the base and the exponent, computing ${k}^${n} instead of ${n}^${k}, giving ${swapped}.`,
          misconception: "Swapped base and exponent (k^n).",
          correctAnswer: String(right),
          wrongAnswer: String(swapped),
          steps: [
            `Order matters and repeats are allowed, so each of the ${k} slots has ${n} options.`,
            `So the count is **${k}^${n}** — slots raised to the power of options.`,
            `${k}^${n} = **${swapped}**.`,
          ],
          wrongStepIndex: 1,
          canonicalExplanation: `It's options raised to slots: ${n}^${k} = **${right}**, not ${k}^${n} = ${swapped}.`,
        };
      }
      const slots = k - 1;
      const wrong = power(n, slots); // multiplied for one too few slots
      const wrongProduct = Array(slots).fill(n).join(" × ");
      return {
        framing: `Build a **${k}**-long sequence where each slot is one of **${n}** options (repeats allowed).`,
        method: `Options raised to the number of slots: ${n}^${k} = ${right}.`,
        slipInstruction: `multiply ${n} for only ${slots} of the slots instead of all ${k}, computing ${n}^${slots} = ${wrong}.`,
        misconception: "Multiplied for one too few slots.",
        correctAnswer: String(right),
        wrongAnswer: String(wrong),
        steps: [
          `Order matters and repeats are allowed, so each of the ${k} slots has ${n} options.`,
          `Multiply ${n} for **${slots}** of the slots.`,
          `${wrongProduct} = **${wrong}**.`,
        ],
        wrongStepIndex: 1,
        canonicalExplanation: `There are ${k} slots, so multiply ${n} that many times: ${n}^${k} = **${right}**.`,
      };
    }
    case "multiset": {
      const n = num(p.n); // kinds
      const k = num(p.k); // picks
      const right = combinations(n + k - 1, k);
      const wrong = combinations(n + k, k); // n bars instead of n-1
      return {
        framing: `Pick **${k}** items from **${n}** kinds, where the same kind can repeat and order doesn't matter.`,
        method: `Stars and bars: ${k} stars and ${n - 1} bars, C(${n + k - 1}, ${k}) = ${right}.`,
        slipInstruction: `use ${n} bars instead of ${n - 1} for the ${n} kinds, giving C(${k} + ${n}, ${k}) = C(${n + k}, ${k}) = ${wrong}.`,
        misconception: "Used n bars instead of n−1.",
        correctAnswer: String(right),
        wrongAnswer: String(wrong),
        steps: [
          `Repeats allowed and order ignored, so use stars and bars.`,
          `**${k}** stars (the picks) and **${n}** bars to separate the ${n} kinds.`,
          `Choose bar spots: C(${k} + ${n}, ${k}) = C(${n + k}, ${k}) = **${wrong}**.`,
        ],
        wrongStepIndex: 1,
        canonicalExplanation: `${n} kinds need only **${n - 1}** bars, so C(${k} + ${n} − 1, ${k}) = C(${n + k - 1}, ${k}) = **${right}**.`,
      };
    }
    case "distribute": {
      const items = num(p.items);
      const bins = num(p.bins);
      const right = combinations(items + bins - 1, bins - 1);
      const wrong = combinations(items + bins, bins); // bins bars instead of bins-1
      return {
        framing: `Distribute **${items}** identical items into **${bins}** distinct bins (a bin may get none).`,
        method: `Stars and bars: ${items} stars and ${bins - 1} bars, C(${items + bins - 1}, ${bins - 1}) = ${right}.`,
        slipInstruction: `use ${bins} bars instead of ${bins - 1} between the ${bins} bins, giving C(${items} + ${bins}, ${bins}) = C(${items + bins}, ${bins}) = ${wrong}.`,
        misconception: "Used bins bars instead of bins−1.",
        correctAnswer: String(right),
        wrongAnswer: String(wrong),
        steps: [
          `Items are identical and bins are distinct, so use stars and bars.`,
          `**${items}** stars (the items) and **${bins}** bars between the bins.`,
          `Choose bar spots: C(${items} + ${bins}, ${bins}) = C(${items + bins}, ${bins}) = **${wrong}**.`,
        ],
        wrongStepIndex: 1,
        canonicalExplanation: `${bins} bins need only **${bins - 1}** bars, so C(${items} + ${bins} − 1, ${bins} − 1) = C(${items + bins - 1}, ${bins - 1}) = **${right}**.`,
      };
    }
    case "classify": {
      const correctKey = String(q.answer);
      const correct = CELL_INFO[correctKey] ?? CELL_INFO.permutations;
      const framing =
        typeof p.prompt === "string" && p.prompt.length > 0
          ? p.prompt
          : "Classify this counting scenario into the right world.";
      // Deterministically flip ONE of the two classifiers.
      const flipOrder = (num(p.n) + num(p.k)) % 2 === 0;
      const antOrder = flipOrder ? !correct.order : correct.order;
      const antRepeat = flipOrder ? correct.repeat : !correct.repeat;
      const wrongKey = quadrant(antOrder, antRepeat);
      const wrongName = CELL_INFO[wrongKey]?.name ?? "the wrong world";
      const yesno = (b: boolean) => (b ? "yes" : "no");
      return {
        framing,
        method: `Order ${correct.order ? "matters" : "doesn't matter"} and items ${correct.repeat ? "can repeat" : "can't repeat"} → ${correct.name}.`,
        slipInstruction: `answer the "${flipOrder ? "does order matter?" : "can items repeat?"}" question wrong (say ${yesno(flipOrder ? antOrder : antRepeat)}), landing on ${wrongName}.`,
        misconception: `Got the "${flipOrder ? "order" : "repeats"}" question wrong.`,
        correctAnswer: correct.name,
        wrongAnswer: wrongName,
        steps: [
          `Q1 — does order matter? The ant says **${yesno(antOrder)}**.`,
          `Q2 — can the same item repeat? The ant says **${yesno(antRepeat)}**.`,
          `Those answers point to **${wrongName}**.`,
        ],
        wrongStepIndex: flipOrder ? 0 : 1,
        canonicalExplanation: `Order ${correct.order ? "does" : "doesn't"} matter and items ${correct.repeat ? "can" : "can't"} repeat, so it's **${correct.name}**, not ${wrongName}.`,
      };
    }
    default: {
      return {
        framing: `A ${q.label} problem.`,
        method: `The correct answer is ${q.answer}.`,
        slipInstruction: `make one small slip in a single step.`,
        misconception: "A slip in one step of the count.",
        correctAnswer: String(q.answer),
        wrongAnswer: "the wrong count",
        steps: [
          "Set up the right counting rule.",
          "Apply it step by step — but one step has a small slip.",
        ],
        wrongStepIndex: 1,
        canonicalExplanation: `The correct answer is ${q.answer}. Re-check each step to find the single slip.`,
      };
    }
  }
}

/**
 * Build a deterministic wrong solution that follows the CORRECT method but makes
 * the ONE fixed slip for this question type in a single step (`wrongStepIndex`).
 * Used whenever the AI is unavailable (always in production) and as the
 * validated fallback for the AI path.
 */
export function authoredExample(q: MissedQuestion): ErroneousExample {
  const f = slipFactsFor(q);
  return {
    setup: f.framing,
    steps: f.steps,
    wrongStepIndex: f.wrongStepIndex,
    wrongAnswer: f.wrongAnswer,
    correctAnswer: f.correctAnswer,
    misconception: f.misconception,
    canonicalExplanation: f.canonicalExplanation,
  };
}

/* -------------------------------- AI helpers -------------------------------- */

const EXAMPLE_SYSTEM_PROMPT =
  "You generate a teaching artifact for a combinatorics app for teenagers. A " +
  '"rookie ant" solves ONE counting problem as a short, numbered, step-by-step ' +
  "worked solution written in Markdown. The method is correct and EVERY step is " +
  "correct EXCEPT exactly ONE step, which must contain the SPECIFIC slip described " +
  "in the request and nothing else. That one step makes the final answer wrong; all " +
  "other steps stay correct and consistent with it. Do NOT invent a different " +
  "mistake, do NOT add extra mistakes, and do NOT do any arithmetic — use the EXACT " +
  "correctAnswer and wrongAnswer values given. Respond with STRICT JSON only (no " +
  "text outside the JSON) using exactly this shape: " +
  '{"setup": string, "steps": string[], "wrongStepIndex": number, "wrongAnswer": ' +
  'string, "correctAnswer": string, "misconception": string, "canonicalExplanation": ' +
  "string}. steps is 3-4 Markdown lines (the numbered worked solution), exactly one " +
  "of them wrong. wrongStepIndex is the 0-based index of that one wrong step. Keep " +
  "each step under ~16 words. Write exponents like 4^3 and products like 4 × 4 × 4. " +
  "misconception is a short phrase (<= 8 words). canonicalExplanation is ONE Markdown " +
  "sentence naming the slipped step and the fix. No greetings or sign-offs.";

function exampleUserPrompt(q: MissedQuestion, facts: SlipFacts): string {
  return [
    `Problem type: ${q.label} (templateId=${q.templateId}).`,
    `Framing: ${facts.framing}`,
    `Numbers (params): ${JSON.stringify(q.params)}.`,
    `Correct method: ${facts.method}`,
    `Correct answer (use exactly this): ${facts.correctAnswer}.`,
    `The rookie ant must make EXACTLY this slip and no other error: ${facts.slipInstruction}`,
    `With that slip the final answer must come out to exactly: ${facts.wrongAnswer}.`,
    "Put the slip in a single step and set wrongStepIndex to that step.",
  ].join("\n");
}

function normalizeExample(
  raw: unknown,
  q: MissedQuestion,
  facts: SlipFacts,
): ErroneousExample {
  const fallback = authoredExample(q);
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown, fb: string): string =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : fb;
  const parsed = Array.isArray(o.steps)
    ? o.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];
  const steps = parsed.length > 0 ? parsed.slice(0, 6) : fallback.steps;
  // Clamp the slipped-step index into range; default to the authored index.
  const rawIdx =
    typeof o.wrongStepIndex === "number" ? Math.floor(o.wrongStepIndex) : NaN;
  const wrongStepIndex = Number.isFinite(rawIdx)
    ? Math.min(Math.max(rawIdx, 0), steps.length - 1)
    : Math.min(fallback.wrongStepIndex, steps.length - 1);
  return {
    setup: str(o.setup, fallback.setup),
    steps,
    wrongStepIndex,
    // Trust the code-computed numbers over anything the model returns.
    wrongAnswer: facts.wrongAnswer,
    correctAnswer: facts.correctAnswer,
    misconception: str(o.misconception, fallback.misconception),
    canonicalExplanation: str(o.canonicalExplanation, fallback.canonicalExplanation),
  };
}

async function chat(system: string, user: string): Promise<unknown> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("No content");
  return JSON.parse(content);
}

/**
 * Build a wrong worked solution for the learner to critique. Calls OpenAI when
 * the local-dev key is set, and otherwise (or on any error) returns the
 * deterministic authored example.
 */
export async function buildErroneousExample(
  q: MissedQuestion,
): Promise<ErroneousExample> {
  if (!isCritiqueAiEnabled()) return authoredExample(q);
  const facts = slipFactsFor(q);
  try {
    const raw = await chat(EXAMPLE_SYSTEM_PROMPT, exampleUserPrompt(q, facts));
    return normalizeExample(raw, q, facts);
  } catch {
    return authoredExample(q);
  }
}

const JUDGE_SYSTEM_PROMPT =
  "You are Andi, a warm ant tutor. A learner is shown a 'rookie ant's' step-by-step " +
  "solution, CLICKS the step they think is wrong, and types WHY it's wrong. You are " +
  "told whether they clicked the correct step. Judge whether their written reason " +
  "correctly explains the actual mistake in that step (not just that the number is " +
  "off). If they clicked the wrong step, it is NOT satisfactory. Be encouraging but " +
  "honest. Respond with STRICT JSON only using exactly this shape: " +
  '{"satisfactory": boolean, "feedback": string}. feedback is 1-2 warm sentences ' +
  "reacting to what they wrote. No greetings or sign-offs.";

function judgeUserPrompt(
  example: ErroneousExample,
  studentText: string,
  pickCorrect: boolean,
): string {
  const slipped = example.steps[example.wrongStepIndex] ?? "";
  return [
    `The rookie ant's steps: ${example.steps.join(" | ")}`,
    `The ONE step with the slip (index ${example.wrongStepIndex}): "${slipped}"`,
    `The actual mistake (misconception): ${example.misconception}`,
    `The correct fix: ${example.canonicalExplanation}`,
    `Did the learner click the correct step? ${pickCorrect ? "Yes" : "No"}.`,
    "",
    `The learner's written reason: "${studentText}"`,
    "Judge whether their reason correctly explains the mistake in that step.",
  ].join("\n");
}

/** Heuristic verdict used if the AI judge errors mid-call. */
function heuristicJudge(studentText: string, pickCorrect: boolean): CritiqueJudgement {
  const enough = studentText.trim().split(/\s+/).length >= 5;
  const ok = pickCorrect && enough;
  return {
    satisfactory: ok,
    feedback: ok
      ? "Nice — you found the slipped step and talked it through."
      : pickCorrect
        ? "Right step! Try to say a bit more about why that move is wrong."
        : "That wasn't the slipped step — let's look at where it really goes wrong.",
  };
}

/**
 * Judge the learner's written reason for the slip. The caller passes whether the
 * learner clicked the correct step; a wrong pick is never satisfactory. On any
 * error it degrades to a light heuristic so the flow never dead-ends.
 */
export async function judgeExplanation(
  example: ErroneousExample,
  studentText: string,
  pickCorrect: boolean,
): Promise<CritiqueJudgement> {
  if (!isCritiqueAiEnabled()) return heuristicJudge(studentText, pickCorrect);
  try {
    const raw = await chat(
      JUDGE_SYSTEM_PROMPT,
      judgeUserPrompt(example, studentText, pickCorrect),
    );
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      // A wrong pick can never pass, regardless of the model.
      satisfactory: pickCorrect && o.satisfactory === true,
      feedback:
        typeof o.feedback === "string" && o.feedback.trim().length > 0
          ? o.feedback.trim()
          : heuristicJudge(studentText, pickCorrect).feedback,
    };
  } catch {
    return heuristicJudge(studentText, pickCorrect);
  }
}

const MINI_SYSTEM_PROMPT =
  "You are Andi, a warm ant tutor. A learner could not fully explain a rookie " +
  "ant's mistake, so give a VERY short, engaging fix. Respond with STRICT JSON only " +
  'using exactly this shape: {"point": string, "fix": string, "tryThis": string}. ' +
  "point names the misconception in one short line. fix is one corrected micro-step. " +
  "tryThis is a quick 'now you try' nudge. Keep each under ~20 words. No greetings.";

function miniUserPrompt(example: ErroneousExample, studentText: string): string {
  return [
    `Misconception: ${example.misconception}`,
    `Correct idea: ${example.canonicalExplanation}`,
    `The learner wrote: "${studentText}"`,
    "Give the short fix, reacting to what they missed.",
  ].join("\n");
}

/** Authored mini-lesson derived from the example (used when AI is off). */
function authoredMiniLesson(example: ErroneousExample): MiniLesson {
  return {
    point: example.misconception,
    fix: example.canonicalExplanation,
    tryThis: "Re-do the count one step at a time and watch where the rule changes.",
  };
}

/**
 * A very short, reactive mini-lesson shown when the explanation falls short.
 * Reacts to what the learner wrote when AI is enabled; authored otherwise.
 */
export async function miniLessonFor(
  example: ErroneousExample,
  studentText: string,
): Promise<MiniLesson> {
  if (!isCritiqueAiEnabled()) return authoredMiniLesson(example);
  try {
    const raw = await chat(MINI_SYSTEM_PROMPT, miniUserPrompt(example, studentText));
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const fb = authoredMiniLesson(example);
    const str = (v: unknown, f: string): string =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : f;
    return {
      point: str(o.point, fb.point),
      fix: str(o.fix, fb.fix),
      tryThis: str(o.tryThis, fb.tryThis),
    };
  } catch {
    return authoredMiniLesson(example);
  }
}
