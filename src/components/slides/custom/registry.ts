import type { ComponentType } from "react";
import type { CustomSlide } from "../../../types";
import FourWorldsMap from "./FourWorldsMap";
import ClassifyExamples from "./ClassifyExamples";
import PizzaClassify from "./PizzaClassify";
import ReviewMap from "./ReviewMap";
import FillSeats from "./FillSeats";
import BuildPodium from "./BuildPodium";
import Factorials from "./Factorials";
import PermuteK from "./PermuteK";
import PermutationFormula from "./PermutationFormula";
import BooksMcq from "./BooksMcq";
import RefillChoices from "./RefillChoices";
import BuildFlips from "./BuildFlips";
import PowerExplorer from "./PowerExplorer";
import ReuseCompare from "./ReuseCompare";
import PinMcq from "./PinMcq";
import CrackTheCode from "./CrackTheCode";
import CollapseOrders from "./CollapseOrders";
import SelectTeam from "./SelectTeam";
import CombinationFormula from "./CombinationFormula";
import CardsMcq from "./CardsMcq";
import HandshakeParty from "./HandshakeParty";
import TwoStories from "./TwoStories";
import StarsBars from "./StarsBars";
import StarsBarsFormula from "./StarsBarsFormula";
import DistributeBuild from "./DistributeBuild";
import MultisetMcq from "./MultisetMcq";
import DonutBox from "./DonutBox";

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
  "pizza-classify": PizzaClassify,
  "review-map": ReviewMap,
  "fill-seats": FillSeats,
  "build-podium": BuildPodium,
  "factorials": Factorials,
  "permute-k": PermuteK,
  "permutation-formula": PermutationFormula,
  "books-mcq": BooksMcq,
  // Lesson 3 — Order matters, with reuse (nᵏ)
  "refill-choices": RefillChoices,
  "build-flips": BuildFlips,
  "power-explorer": PowerExplorer,
  "reuse-compare": ReuseCompare,
  "pin-mcq": PinMcq,
  "crack-the-code": CrackTheCode,
  // Lesson 4 — Order doesn't matter, no reuse (combinations)
  "collapse-orders": CollapseOrders,
  "select-team": SelectTeam,
  "combination-formula": CombinationFormula,
  "cards-mcq": CardsMcq,
  "handshake-party": HandshakeParty,
  // Lesson 5 — Multisets / stars and bars
  "two-stories": TwoStories,
  "stars-bars": StarsBars,
  "stars-bars-formula": StarsBarsFormula,
  "distribute-build": DistributeBuild,
  "multiset-mcq": MultisetMcq,
  "donut-box": DonutBox,
};
