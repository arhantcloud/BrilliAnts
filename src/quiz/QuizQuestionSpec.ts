import type { FC } from "react";
import type { GeneratedQuestion } from "../types";
import type { Rng } from "./rng";

/**
 * Props every quiz question view receives from the QuizPlayer.
 *
 * The view renders the interactive (non-MCQ) problem from `question.params`,
 * owns its own input + Submit, and once the learner submits it locks itself,
 * reveals right/wrong against `question.answer`, and calls `onResult(correct)`
 * exactly once. `locked` is also driven by the player so a question never
 * accepts a second answer after the run has moved on.
 */
export type QuizQuestionViewProps = {
  question: GeneratedQuestion;
  locked: boolean;
  onResult: (correct: boolean) => void;
};

/**
 * A single quiz question template. `generate(rng)` produces a fresh,
 * randomized `GeneratedQuestion` (clean-integer answers) for one slot of an
 * attempt; `Component` renders it.
 */
export type QuizQuestionSpec = {
  /** Stable template id, registered in src/quiz/registry.ts. */
  id: string;
  /** Lesson this template belongs to (matches Lesson.id / LessonQuiz.lessonId). */
  lessonId: string;
  /** Build one randomized question. */
  generate: (rng: Rng) => GeneratedQuestion;
  /** Interactive view for a generated question. */
  Component: FC<QuizQuestionViewProps>;
};
