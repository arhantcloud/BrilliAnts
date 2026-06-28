import type { Mistake } from "../types";

/**
 * Human-readable name for the kind of question a mistake (ant) represents,
 * shown when hovering an ant in the colony. Mirrors the quiz templates and the
 * permutation style variants (cross-out / formula / descending product).
 */
export function describeProblem(mistake: Pick<Mistake, "templateId" | "style">): string {
  switch (mistake.templateId) {
    case "classify":
      return "Classify: order & repetition";
    case "permutation":
      switch (mistake.style) {
        case 0:
          return "Permutation: cross-out method";
        case 1:
          return "Permutation: factorial formula";
        case 2:
          return "Permutation: descending product";
        default:
          return "Permutation";
      }
    case "combination":
      return "Combination: choose formula";
    case "sequence":
      return "Sequence: n to the k";
    case "multiset":
      return "Multiset: C(n + k − 1, k)";
    case "distribute":
      return "Distributing = choosing";
    // Ant Army upgrade challenges (harder, distinct formats).
    case "classify-quadsort":
      return "Sort all four worlds";
    case "classify-twin":
      return "Spot the world (twin trap)";
    case "perm-restricted":
      return "Permutation with a fixed position";
    case "perm-circular":
      return "Circular permutation";
    case "seq-constraint":
      return "Sequence with a first-slot rule";
    case "seq-atleastone":
      return "Sequence: at least once";
    case "comb-must":
      return "Combination with a required member";
    case "comb-atleast":
      return "Combination: at least one";
    case "multi-min":
      return "Multiset with a minimum";
    case "multi-bounded":
      return "Multiset with a cap";
    case "dist-fair":
      return "Distribute: each at least one";
    case "dist-capped":
      return "Distribute with a cap";
    default:
      return mistake.templateId;
  }
}
