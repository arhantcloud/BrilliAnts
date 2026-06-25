import type { ComponentType } from "react";
import type { CustomSlide } from "../../../types";
import FourWorldsMap from "./FourWorldsMap";
import ClassifyExamples from "./ClassifyExamples";
import ConnectCategories from "./ConnectCategories";
import ReviewMap from "./ReviewMap";
import FillSeats from "./FillSeats";
import BuildPodium from "./BuildPodium";
import Factorials from "./Factorials";
import PermuteK from "./PermuteK";
import PermutationFormula from "./PermutationFormula";
import RefillChoices from "./RefillChoices";
import PowerExplorer from "./PowerExplorer";
import ReuseCompare from "./ReuseCompare";
import CrackTheCode from "./CrackTheCode";
import SelectTeam from "./SelectTeam";
import CollapseOrderings from "./CollapseOrderings";
import CombinationFormula from "./CombinationFormula";
import HandshakeParty from "./HandshakeParty";
import MultisetBuild from "./MultisetBuild";
import MultisetDistribute from "./MultisetDistribute";
import MultisetStarsBars from "./MultisetStarsBars";
import MultisetFormula from "./MultisetFormula";
import MultisetBox from "./MultisetBox";

/** Props every custom slide component receives. */
export type CustomSlideProps = {
  slide: CustomSlide;
  onComplete: () => void;
};

/**
 * Maps a slide's `component` key to its React component. Add new bespoke
 * interactive slides here as we build them.
 */
export const customSlideRegistry: Record<
  string,
  ComponentType<CustomSlideProps>
> = {
  "four-worlds-map": FourWorldsMap,
  "classify-examples": ClassifyExamples,
  "connect-categories": ConnectCategories,
  "review-map": ReviewMap,
  "fill-seats": FillSeats,
  "build-podium": BuildPodium,
  "factorials": Factorials,
  "permute-k": PermuteK,
  "permutation-formula": PermutationFormula,
  // Lesson 3 — Order matters, with reuse (nᵏ)
  "refill-choices": RefillChoices,
  "power-explorer": PowerExplorer,
  "reuse-compare": ReuseCompare,
  "crack-the-code": CrackTheCode,
  // Lesson 4 — Order doesn't matter, no reuse (combinations)
  "select-team": SelectTeam,
  "collapse-orderings": CollapseOrderings,
  "combination-formula": CombinationFormula,
  "handshake-party": HandshakeParty,
  // Lesson 5 — Order doesn't matter, with reuse (multisets / stars and bars)
  "multiset-build": MultisetBuild,
  "multiset-distribute": MultisetDistribute,
  "multiset-stars-bars": MultisetStarsBars,
  "multiset-formula": MultisetFormula,
  "multiset-box": MultisetBox,
};
