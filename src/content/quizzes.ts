import type { GeneratedQuestion, LessonQuiz } from "../types";
import { getTemplate } from "../quiz/registry";
import { createRng, type Rng } from "../quiz/rng";

/**
 * Per-lesson post-lesson quizzes. Each lesson draws all of its questions from a
 * single hard, parameterized template (one per lesson); `drawQuiz` produces a
 * fresh set with distinct numbers on every attempt.
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
  // Lesson 5 (multisets) has no post-lesson quiz.
};

export function getLessonQuiz(lessonId: string): LessonQuiz | undefined {
  return lessonQuizzes[lessonId];
}

/** Signature of a question's numeric params — used to keep an attempt's numbers distinct. */
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
