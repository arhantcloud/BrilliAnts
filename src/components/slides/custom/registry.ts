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
import BooksMcq from "./BooksMcq";
import RefillChoices from "./RefillChoices";
import BuildFlips from "./BuildFlips";
import PowerExplorer from "./PowerExplorer";
import ReuseCompare from "./ReuseCompare";
import PinMcq from "./PinMcq";
import CollapseOrders from "./CollapseOrders";
import SelectTeam from "./SelectTeam";
import CombinationFormula from "./CombinationFormula";
import CardsMcq from "./CardsMcq";
import TwoStories from "./TwoStories";
import StarsBars from "./StarsBars";
import DistributeBuild from "./DistributeBuild";
import MultisetMcq from "./MultisetMcq";

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
  "books-mcq": BooksMcq,
  // Lesson 3 — Order matters, with reuse (nᵏ)
  "refill-choices": RefillChoices,
  "build-flips": BuildFlips,
  "power-explorer": PowerExplorer,
  "reuse-compare": ReuseCompare,
  "pin-mcq": PinMcq,
  // Lesson 4 — Order doesn't matter, no reuse (combinations)
  "collapse-orders": CollapseOrders,
  "select-team": SelectTeam,
  "combination-formula": CombinationFormula,
  "cards-mcq": CardsMcq,
  // Lesson 5 — Multisets / stars and bars
  "two-stories": TwoStories,
  "stars-bars": StarsBars,
  "distribute-build": DistributeBuild,
  "multiset-mcq": MultisetMcq,
};
