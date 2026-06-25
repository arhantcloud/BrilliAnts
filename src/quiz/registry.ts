import type { QuizQuestionSpec } from "./QuizQuestionSpec";
import { spec as classify } from "./templates/ClassifyQuestion";
import { spec as permutation } from "./templates/PermutationQuestion";
import { spec as combination } from "./templates/CombinationQuestion";

/**
 * Registry of quiz question templates, keyed by template id. LessonQuiz entries
 * (src/content/quizzes.ts) reference these ids; the QuizPlayer looks the spec up
 * to generate + render each question.
 */
export const quizTemplates: Record<string, QuizQuestionSpec> = {
  [classify.id]: classify,
  [permutation.id]: permutation,
  [combination.id]: combination,
};

export function getTemplate(id: string): QuizQuestionSpec | undefined {
  return quizTemplates[id];
}
