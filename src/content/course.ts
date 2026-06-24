import type { Course } from "../types";

export const course: Course = {
  id: "counting-combinatorics",
  title: "Counting & Combinatorics",
  description:
    "Build real intuition for counting. Learn the four kinds of counting problems and see how choosing and distributing are two sides of the same coin.",
  lessons: [
    {
      id: "l1-two-questions",
      title: "The Two Questions",
      summary:
        "Every counting problem comes down to two questions. Learn the 2x2 map.",
      estimatedMinutes: 4,
      slides: [
        {
          id: "l1-s1",
          type: "custom",
          component: "four-worlds-map",
          title: "The four kinds of counting",
        },
        {
          id: "l1-s2",
          type: "custom",
          component: "classify-examples",
          title: "Sort each example",
        },
        {
          id: "l1-s3",
          type: "custom",
          component: "pizza-classify",
          title: "Build-your-own pizza",
        },
        {
          id: "l1-s4",
          type: "custom",
          component: "review-map",
          title: "Review: the four kinds",
        },
      ],
    },
    {
      id: "l2-perm-no-rep",
      title: "Order Matters, No Reuse",
      summary: "Arrangements and permutations: when position is everything.",
      estimatedMinutes: 5,
      slides: [
        {
          id: "l2-s1",
          type: "custom",
          component: "fill-seats",
          title: "Fill the seats",
        },
        {
          id: "l2-s2",
          type: "custom",
          component: "factorials",
          title: "Factorials",
        },
        {
          id: "l2-s3",
          type: "custom",
          component: "build-podium",
          title: "Race to the podium",
        },
        {
          id: "l2-s4",
          type: "custom",
          component: "permute-k",
          title: "Pick k of n",
        },
        {
          id: "l2-s5",
          type: "custom",
          component: "permutation-formula",
          title: "The permutation formula",
        },
      ],
    },
    {
      id: "l3-order-rep",
      title: "Order Matters, With Reuse",
      summary: "Independent choices and the power of n to the k.",
      estimatedMinutes: 5,
      slides: [
        {
          id: "l3-s1",
          type: "custom",
          component: "refill-choices",
          title: "Choices that don't run out",
        },
        {
          id: "l3-s3",
          type: "custom",
          component: "power-explorer",
          title: "n to the k",
        },
        {
          id: "l3-s4",
          type: "custom",
          component: "reuse-compare",
          title: "Why reuse counts more",
        },
        {
          id: "l3-s5",
          type: "custom",
          component: "crack-the-code",
          title: "Crack the code",
        },
      ],
    },
    {
      id: "l4-comb-no-rep",
      title: "Order Doesn't Matter, No Reuse",
      summary: "Combinations: choosing a group when arrangement is irrelevant.",
      estimatedMinutes: 5,
      slides: [
        {
          id: "l4-s1",
          type: "custom",
          component: "collapse-orders",
          title: "When order stops mattering",
        },
        {
          id: "l4-s2",
          type: "custom",
          component: "select-team",
          title: "Pick the team",
        },
        {
          id: "l4-s3",
          type: "custom",
          component: "combination-formula",
          title: "Divide out the orderings",
        },
        {
          id: "l4-s4",
          type: "custom",
          component: "handshake-party",
          title: "The handshake party",
        },
      ],
    },
    {
      id: "l5-choice-distribution",
      title: "Choice vs. Distribution",
      summary:
        "The big connection: choosing items and distributing items count the same things.",
      estimatedMinutes: 6,
      slides: [
        {
          id: "l5-s1",
          type: "custom",
          component: "two-stories",
          title: "Two stories, one count",
        },
        {
          id: "l5-s2",
          type: "custom",
          component: "stars-bars",
          title: "Stars and bars",
        },
        {
          id: "l5-s3",
          type: "custom",
          component: "stars-bars-formula",
          title: "The stars-and-bars formula",
        },
        {
          id: "l5-s4",
          type: "custom",
          component: "donut-box",
          title: "The donut box",
        },
      ],
    },
  ],
};
