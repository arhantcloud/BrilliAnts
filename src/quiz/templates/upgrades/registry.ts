import type { QuizQuestionSpec } from "../../QuizQuestionSpec";
import { quadsortSpec, twinSpec } from "./L1ClassifyUpgrades";
import { permRestrictedSpec, permCircularSpec } from "./L2PermUpgrades";
import { seqConstraintSpec, seqAtLeastOneSpec } from "./L3SeqUpgrades";
import { combMustSpec, combAtLeastSpec } from "./L4CombUpgrades";
import { multiMinSpec, multiBoundedSpec } from "./L5MultiUpgrades";
import { distFairSpec, distCappedSpec } from "./L6DistUpgrades";

/**
 * Registry of Ant Army upgrade-challenge templates, keyed by template id. Kept
 * separate from the lesson `quizTemplates` so these harder, differently-formatted
 * questions never leak into the lesson quizzes or final exam; the army's
 * config.upgradeTemplateId() maps a topic + rank to one of these ids.
 */
export const upgradeTemplates: Record<string, QuizQuestionSpec> = {
  [quadsortSpec.id]: quadsortSpec,
  [twinSpec.id]: twinSpec,
  [permRestrictedSpec.id]: permRestrictedSpec,
  [permCircularSpec.id]: permCircularSpec,
  [seqConstraintSpec.id]: seqConstraintSpec,
  [seqAtLeastOneSpec.id]: seqAtLeastOneSpec,
  [combMustSpec.id]: combMustSpec,
  [combAtLeastSpec.id]: combAtLeastSpec,
  [multiMinSpec.id]: multiMinSpec,
  [multiBoundedSpec.id]: multiBoundedSpec,
  [distFairSpec.id]: distFairSpec,
  [distCappedSpec.id]: distCappedSpec,
};

export function getUpgradeTemplate(id: string): QuizQuestionSpec | undefined {
  return upgradeTemplates[id];
}
