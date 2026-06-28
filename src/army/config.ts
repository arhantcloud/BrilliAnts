/**
 * Static configuration for the Ant Army base: which topics have anthills, how
 * each anthill recruits ants, the per-rank upgrade challenge for each topic, and
 * the per-topic accent colour used for signs and banners.
 */

import type { AntRank, ArmyAnt } from "../types";

/** The six topics (lesson ids), in base layout order. */
export const ARMY_TOPIC_IDS = [
  "l1-two-questions",
  "l2-perm-no-rep",
  "l3-order-rep",
  "l4-comb-no-rep",
  "l5-choice-distribution",
  "l6-choose-distribute",
] as const;

export type ArmyTopicId = (typeof ARMY_TOPIC_IDS)[number];

/**
 * Topics with a standalone quiz: their anthill auto-recruits a worker per
 * correct quiz answer (best score), capped at 5.
 */
const QUIZ_TOPIC_IDS = new Set<string>([
  "l1-two-questions",
  "l2-perm-no-rep",
  "l4-comb-no-rep",
]);

/** True for topics that recruit via a button (one question per click). */
export function isButtonTopic(topicId: string): boolean {
  return (
    ARMY_TOPIC_IDS.includes(topicId as ArmyTopicId) &&
    !QUIZ_TOPIC_IDS.has(topicId)
  );
}

/** True for topics whose anthill is fed by quiz scores. */
export function isQuizTopic(topicId: string): boolean {
  return QUIZ_TOPIC_IDS.has(topicId);
}

/** Maximum ants a topic's anthill can hold. Every anthill holds up to 5. */
export function anthillCap(_topicId: string): number {
  return 5;
}

/**
 * An anthill's current tier from its ants: it stays tier 0 until full (all 5
 * ants present), then equals the lowest rank shared by every ant (so a hill is
 * tier 1 once every ant is at least a warrior, tier 2 once all are generals).
 */
export function computeAnthillTier(ants: ArmyAnt[], topicId: string): AntRank {
  if (ants.length < anthillCap(topicId)) return 0;
  return ants.reduce<AntRank>((m, a) => (a.rank < m ? a.rank : m), 2);
}

/**
 * The (up to two) anthills adjacent to `topicId` in the base layout order:
 * the previous and next topics in {@link ARMY_TOPIC_IDS}.
 */
export function neighborTopicIds(topicId: string): string[] {
  const i = ARMY_TOPIC_IDS.indexOf(topicId as ArmyTopicId);
  if (i < 0) return [];
  const out: string[] = [];
  if (i > 0) out.push(ARMY_TOPIC_IDS[i - 1]);
  if (i < ARMY_TOPIC_IDS.length - 1) out.push(ARMY_TOPIC_IDS[i + 1]);
  return out;
}

/**
 * Whether an ant in `topicId` may be promoted to GENERAL (rank 1 -> 2). Beyond
 * the per-ant wait/attempt gate, every neighbouring anthill (max two) must be
 * at least tier 1 (fortified). `tierOf` returns a given anthill's current tier.
 */
export function neighborsAllowGeneral(
  topicId: string,
  tierOf: (id: string) => AntRank,
): boolean {
  return neighborTopicIds(topicId).every((n) => tierOf(n) >= 1);
}

/**
 * The upgrade-challenge template id for promoting an ant of `currentRank` in a
 * topic. Worker (0) -> warrior uses the tier-1 template; warrior (1) -> general
 * uses the harder tier-2 template. Returns null at max rank.
 */
export function upgradeTemplateId(
  topicId: string,
  currentRank: AntRank,
): string | null {
  const pair = UPGRADE_TEMPLATES[topicId];
  if (!pair) return null;
  if (currentRank === 0) return pair.toWarrior;
  if (currentRank === 1) return pair.toGeneral;
  return null;
}

const UPGRADE_TEMPLATES: Record<
  string,
  { toWarrior: string; toGeneral: string }
> = {
  "l1-two-questions": {
    toWarrior: "classify-quadsort",
    toGeneral: "classify-twin",
  },
  "l2-perm-no-rep": {
    toWarrior: "perm-restricted",
    toGeneral: "perm-circular",
  },
  "l3-order-rep": {
    toWarrior: "seq-constraint",
    toGeneral: "seq-atleastone",
  },
  "l4-comb-no-rep": {
    toWarrior: "comb-must",
    toGeneral: "comb-atleast",
  },
  "l5-choice-distribution": {
    toWarrior: "multi-min",
    toGeneral: "multi-bounded",
  },
  "l6-choose-distribute": {
    toWarrior: "dist-fair",
    toGeneral: "dist-capped",
  },
};

/**
 * For button topics, the base quiz template used for the single recruit
 * question (reuses the existing registered templates for those lessons).
 */
export function recruitTemplateId(topicId: string): string | null {
  return RECRUIT_TEMPLATES[topicId] ?? null;
}

const RECRUIT_TEMPLATES: Record<string, string> = {
  "l3-order-rep": "sequence",
  "l5-choice-distribution": "multiset",
  "l6-choose-distribute": "distribute",
};

/** Per-topic accent colour (banners, signs) so the six bases read distinctly. */
export const TOPIC_ACCENT: Record<string, string> = {
  "l1-two-questions": "#c2622d", // terracotta
  "l2-perm-no-rep": "#2f8f83", // teal
  "l3-order-rep": "#4f5bbf", // indigo
  "l4-comb-no-rep": "#9b4d8a", // plum
  "l5-choice-distribution": "#c79a2b", // amber
  "l6-choose-distribute": "#c0556b", // rose
};

export function topicAccent(topicId: string): string {
  return TOPIC_ACCENT[topicId] ?? "#c2622d";
}
