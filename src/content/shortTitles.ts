/** Short category names for compact lesson labels (full titles are long). */
export const SHORT_TITLE: Record<string, string> = {
  "l1-two-questions": "The Four Kinds",
  "l2-perm-no-rep": "Permutations",
  "l3-order-rep": "Sequences",
  "l4-comb-no-rep": "Combinations",
  "l5-choice-distribution": "Multisets",
  "l6-choose-distribute": "Choose = Distribute",
};

export const shortTitle = (id: string, fallback: string): string =>
  SHORT_TITLE[id] ?? fallback;
