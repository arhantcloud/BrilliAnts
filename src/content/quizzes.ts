import type { GeneratedQuestion, LessonQuiz } from "../types";
import { getTemplate } from "../quiz/registry";
import { createRng, type Rng } from "../quiz/rng";

/** Synthetic quiz id for the end-of-course final exam (not a real lesson). */
export const FINAL_QUIZ_ID = "course-final";

/**
 * Per-lesson post-lesson quizzes. Each lesson draws all of its questions from a
 * single hard, parameterized template (one per lesson); `drawQuiz` produces a
 * fresh set with distinct numbers on every attempt.
 *
 * The `course-final` entry is the end-of-course exam: 10 questions spanning
 * every concept, drawn from the same question types used in the lesson quizzes
 * (plus one each for the three lessons that have no standalone quiz).
 */
export const lessonQuizzes: Record<string, LessonQuiz> = {
  "l1-two-questions": {
    lessonId: "l1-two-questions",
    templateIds: ["classify"],
    questionCount: 5,
  },
  "l2-perm-no-rep": {
    lessonId: "l2-perm-no-rep",
    templateIds: ["permutation"],
    questionCount: 5,
    // Two cross-out (0), two fill-the-formula (1), one descending-product (2).
    stylePlan: [0, 0, 1, 1, 2],
  },
  "l4-comb-no-rep": {
    lessonId: "l4-comb-no-rep",
    templateIds: ["combination"],
    questionCount: 5,
    // Every question is the same guided derivation (P(n,k), then k!, then divide).
  },
  // Lessons 3, 5, and 6 have no standalone quiz; their question types
  // (sequence / multiset / distribute) are exercised in the final exam below.
  [FINAL_QUIZ_ID]: {
    lessonId: FINAL_QUIZ_ID,
    // With questionCount === templateIds.length, each slot is used once in this
    // exact order: three classify, two permutation, two combination, and one
    // each of the lesson-inspired sequence / multiset / distribute questions.
    templateIds: [
      "classify",
      "permutation",
      "sequence",
      "combination",
      "multiset",
      "classify",
      "permutation",
      "distribute",
      "combination",
      "classify",
    ],
    questionCount: 10,
  },
};

export function getLessonQuiz(lessonId: string): LessonQuiz | undefined {
  return lessonQuizzes[lessonId];
}

/** Signature of a question's numeric params, used to keep an attempt's numbers distinct. */
function numericSignature(q: GeneratedQuestion): string {
  return Object.keys(q.params)
    .filter((key) => typeof q.params[key] === "number")
    .sort()
    .map((key) => `${key}=${q.params[key]}`)
    .join("&");
}

/** Fisher–Yates shuffle driven by the seeded rng (deterministic per attempt). */
function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a fresh attempt's worth of questions for a lesson. Cycles through the
 * lesson's `templateIds` and regenerates as needed so that no two questions in
 * the attempt share the same numbers. Pass a seeded `rng` for deterministic
 * output (tests); omit it for a real, random attempt.
 */
export function drawQuiz(lessonId: string, rng: Rng = createRng()): GeneratedQuestion[] {
  const quiz = lessonQuizzes[lessonId];
  if (!quiz) return [];

  const questions: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  // Shuffle the optional style plan so the variants land in a fresh order each
  // attempt (the multiset of styles is preserved).
  const plan = quiz.stylePlan ? shuffle(rng, quiz.stylePlan) : undefined;

  for (let i = 0; i < quiz.questionCount; i++) {
    const templateId = quiz.templateIds[i % quiz.templateIds.length];
    const spec = getTemplate(templateId);
    if (!spec) continue;

    let question = spec.generate(rng);
    let tries = 0;
    // Avoid repeating the same numbers within one attempt (best effort).
    while (seen.has(numericSignature(question)) && tries < 40) {
      question = spec.generate(rng);
      tries++;
    }
    seen.add(numericSignature(question));

    if (plan && i < plan.length) {
      question = { ...question, params: { ...question.params, style: plan[i] } };
    }
    questions.push(question);
  }

  return questions;
}
