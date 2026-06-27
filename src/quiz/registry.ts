import type { QuizQuestionSpec } from "./QuizQuestionSpec";
import { spec as classify } from "./templates/ClassifyQuestion";
import { spec as permutation } from "./templates/PermutationQuestion";
import { spec as combination } from "./templates/CombinationQuestion";
import { spec as sequence } from "./templates/SequenceQuestion";
import { spec as multiset } from "./templates/MultisetQuestion";
import { spec as distribute } from "./templates/DistributeQuestion";

/**
 * Registry of quiz question templates, keyed by template id. LessonQuiz entries
 * (src/content/quizzes.ts) reference these ids; the QuizPlayer looks the spec up
 * to generate + render each question.
 *
 * All six templates share the same answer interactions (toggles for classify,
 * fill-the-formula text blanks for the rest), so the final exam can mix them
 * freely. The sequence / multiset / distribute templates cover the three lessons
 * that have no standalone quiz.
 */
export const quizTemplates: Record<string, QuizQuestionSpec> = {
  [classify.id]: classify,
  [permutation.id]: permutation,
  [combination.id]: combination,
  [sequence.id]: sequence,
  [multiset.id]: multiset,
  [distribute.id]: distribute,
};

export function getTemplate(id: string): QuizQuestionSpec | undefined {
  return quizTemplates[id];
}
