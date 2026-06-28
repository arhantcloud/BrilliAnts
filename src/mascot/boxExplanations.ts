import type { AntStop } from "./mascot-context";

/**
 * Authored, per-box explanations: the ant's stored "answers".
 *
 * Each quiz template builds its own map of every answer box to a plain-language
 * explanation of (a) what that box represents and (b) how to work out its
 * correct value. Templates then hand the ant only the boxes the learner got
 * wrong (matched to the DOM by `id` === `data-ant-box`). Because the question is
 * already locked once these show, revealing the per-box value is intentional.
 */

export type BoxInfo = AntStop;

type Params = Record<string, number | string>;

/* -------------------------------- classify -------------------------------- */

type ClassifyCell = "permutations" | "sequences" | "combinations" | "multisets";

const CELL_NAME: Record<ClassifyCell, string> = {
  permutations: "Permutations",
  sequences: "Sequences",
  combinations: "Combinations",
  multisets: "Multisets",
};

const ORDER_REASON: Record<ClassifyCell, string> = {
  permutations: "the positions are ranked, so rearranging the picks is a different outcome",
  sequences: "each slot is recorded in sequence, so a different order is a different result",
  combinations: "you end up with an unordered group, so rearranging it changes nothing",
  multisets: "you end up with an unordered collection, so rearranging it changes nothing",
};

const REPEAT_REASON: Record<ClassifyCell, string> = {
  permutations: "each item is used at most once",
  sequences: "each slot is chosen independently, so items can recur",
  combinations: "each item can appear at most once",
  multisets: "the same item can be picked again, so items can recur",
};

export function classifyBoxes(
  cell: ClassifyCell,
  params: Params,
): { order: BoxInfo; repeat: BoxInfo; name: BoxInfo } {
  const orderMatters = cell === "permutations" || cell === "sequences";
  const canRepeat = cell === "sequences" || cell === "multisets";
  const name = CELL_NAME[cell];
  const ai = (boxLabel: string, expected: string) => ({
    templateId: "classify",
    boxLabel,
    expected,
    params,
  });
  return {
    order: {
      id: "classify-order",
      title: "Does order matter?",
      text: `Order ${orderMatters ? "matters" : "doesn't matter"} here because ${ORDER_REASON[cell]}. So the answer is "${orderMatters ? "Yes" : "No"}".`,
      ai: ai("Does order matter?", orderMatters ? "Yes" : "No"),
    },
    repeat: {
      id: "classify-repeat",
      title: "Can items repeat?",
      text: `Items ${canRepeat ? "can" : "cannot"} repeat because ${REPEAT_REASON[cell]}. So the answer is "${canRepeat ? "Yes" : "No"}".`,
      ai: ai("Can items repeat?", canRepeat ? "Yes" : "No"),
    },
    name: {
      id: "classify-name",
      title: "Category name",
      text: `With order ${orderMatters ? "mattering" : "not mattering"} and ${canRepeat ? "repeats allowed" : "no repeats"}, this is a ${name} problem.`,
      ai: ai("Category name", name),
    },
  };
}

/* ------------------------------ permutation ------------------------------- */

type PermCtx = {
  n: number;
  k: number;
  answer: number;
  pool: string;
  params: Params;
};

function permAi(c: PermCtx, boxLabel: string, expected: number) {
  return { templateId: "permutation", boxLabel, expected, params: c.params };
}

/** Fill-the-formula style: P(n,k) = n! / (n-k)!. */
export function permFormulaBoxes(c: PermCtx): {
  notN: BoxInfo;
  notK: BoxInfo;
  numN: BoxInfo;
  denN: BoxInfo;
  denK: BoxInfo;
  res: BoxInfo;
} {
  return {
    notN: {
      id: "perm-notN",
      title: "P(n, k): the n",
      text: `n is the size of the pool you choose from: ${c.n} ${c.pool}. Enter ${c.n}.`,
      ai: permAi(c, "P(n,k) notation n", c.n),
    },
    notK: {
      id: "perm-notK",
      title: "P(n, k): the k",
      text: `k is how many positions you fill in order: ${c.k}. Enter ${c.k}.`,
      ai: permAi(c, "P(n,k) notation k", c.k),
    },
    numN: {
      id: "perm-numN",
      title: "Numerator n!",
      text: `The numerator is n! = ${c.n}!. The number that goes here is n itself: ${c.n}.`,
      ai: permAi(c, "numerator n", c.n),
    },
    denN: {
      id: "perm-denN",
      title: "Denominator (n − k)!",
      text: `The denominator is (n − k)!. The first number is n = ${c.n}.`,
      ai: permAi(c, "denominator n", c.n),
    },
    denK: {
      id: "perm-denK",
      title: "Denominator (n − k)!",
      text: `You subtract k = ${c.k} here, cancelling the ${c.k} positions you fill. Enter ${c.k}.`,
      ai: permAi(c, "denominator k", c.k),
    },
    res: {
      id: "perm-res",
      title: "Result",
      text: `P(${c.n}, ${c.k}) = ${c.n}! / (${c.n} − ${c.k})! = ${c.answer.toLocaleString()}.`,
      ai: permAi(c, "result", c.answer),
    },
  };
}

/** Descending-product style: n · (n-1) · … (k factors). */
export function permProductBoxes(c: PermCtx): {
  terms: BoxInfo[];
  result: BoxInfo;
} {
  const terms = Array.from({ length: c.k }, (_, i) => {
    const expected = c.n - i;
    const remaining = i === 0 ? `all ${c.n}` : `${c.n - i}`;
    return {
      id: `perm-term-${i}`,
      title: `Factor ${i + 1}`,
      text:
        i === 0
          ? `For the first position every ${c.pool} is available, so this factor is ${c.n}.`
          : `After filling ${i} position${i > 1 ? "s" : ""}, ${remaining} ${c.pool} remain, so this factor is ${expected}.`,
      ai: permAi(c, `descending factor ${i + 1}`, expected),
    } satisfies BoxInfo;
  });
  const product = Array.from({ length: c.k }, (_, i) => c.n - i).join(" × ");
  return {
    terms,
    result: {
      id: "perm-product-result",
      title: "Product",
      text: `Multiply the ${c.k} factors: ${product} = ${c.answer.toLocaleString()}.`,
      ai: permAi(c, "product result", c.answer),
    },
  };
}

/** Cross-out style: strike the (n-k)! tail that cancels. */
export function permCrossOutBoxes(c: PermCtx): {
  crossout: BoxInfo;
  result: BoxInfo;
} {
  const cancel = c.n - c.k;
  return {
    crossout: {
      id: "perm-crossout",
      title: "Which factors cancel",
      text: `Cross out exactly the smallest ${cancel} factors (1 through ${cancel}), which is the (n − k)! tail that cancels. Leave the top ${c.k} factors uncrossed.`,
      ai: permAi(c, "factors that cancel", cancel),
    },
    result: {
      id: "perm-crossout-result",
      title: "Total",
      text: `The ${c.k} uncrossed factors multiply to P(${c.n}, ${c.k}) = ${c.answer.toLocaleString()}.`,
      ai: permAi(c, "final count", c.answer),
    },
  };
}

/* ------------------------------ combination ------------------------------- */

type CombCtx = {
  n: number;
  k: number;
  answer: number;
  P: number;
  kf: number;
  params: Params;
};

function combAi(c: CombCtx, boxLabel: string, expected: number) {
  return { templateId: "combination", boxLabel, expected, params: c.params };
}

/**
 * Every box in the guided derivation can be wrong at submit (the question is now
 * all-or-nothing), so Brilli has an explanation for each: the two sub-steps
 * (P(n,k) and k!) and the final division. Templates hand the ant only the boxes
 * the learner actually missed.
 */
export function combinationBoxes(c: CombCtx): {
  pN: BoxInfo;
  pK: BoxInfo;
  pCount: BoxInfo;
  kBase: BoxInfo;
  kCount: BoxInfo;
  cN: BoxInfo;
  cK: BoxInfo;
  num: BoxInfo;
  den: BoxInfo;
  result: BoxInfo;
} {
  return {
    pN: {
      id: "comb-pN",
      title: "Step 1 · P(n, k): the n",
      text: `Step 1 counts the ordered picks. n is the pool size: ${c.n}. Enter ${c.n}.`,
      ai: combAi(c, "permutation n", c.n),
    },
    pK: {
      id: "comb-pK",
      title: "Step 1 · P(n, k): the k",
      text: `k is how many you pick in order: ${c.k}. Enter ${c.k}.`,
      ai: combAi(c, "permutation k", c.k),
    },
    pCount: {
      id: "comb-pCount",
      title: "Step 1 · ordered count",
      text: `P(${c.n}, ${c.k}) is the product of ${c.k} descending factors starting at ${c.n} = ${c.P.toLocaleString()}.`,
      ai: combAi(c, "permutation count", c.P),
    },
    kBase: {
      id: "comb-kBase",
      title: "Step 2 · k!: the base",
      text: `One chosen group of ${c.k} can be arranged k! ways, so the base is k = ${c.k}.`,
      ai: combAi(c, "k base", c.k),
    },
    kCount: {
      id: "comb-kCount",
      title: "Step 2 · k! value",
      text: `${c.k}! = ${c.kf}, the number of orderings of a single group of ${c.k}.`,
      ai: combAi(c, "k factorial count", c.kf),
    },
    cN: {
      id: "comb-cN",
      title: "C(n, k): the n",
      text: `n is the pool size: ${c.n}. Enter ${c.n}.`,
      ai: combAi(c, "combination n", c.n),
    },
    cK: {
      id: "comb-cK",
      title: "C(n, k): the k",
      text: `k is how many you choose: ${c.k}. Enter ${c.k}.`,
      ai: combAi(c, "combination k", c.k),
    },
    num: {
      id: "comb-num",
      title: "Numerator",
      text: `The numerator is the ordered count from step 1: P(${c.n}, ${c.k}) = ${c.P.toLocaleString()}.`,
      ai: combAi(c, "numerator P(n,k)", c.P),
    },
    den: {
      id: "comb-den",
      title: "Denominator",
      text: `The denominator is k! = ${c.k}! = ${c.kf}, the number of orderings you divide out so order stops counting.`,
      ai: combAi(c, "denominator k!", c.kf),
    },
    result: {
      id: "comb-result",
      title: "Result",
      text: `C(${c.n}, ${c.k}) = ${c.P.toLocaleString()} / ${c.kf} = ${c.answer.toLocaleString()}.`,
      ai: combAi(c, "combination result", c.answer),
    },
  };
}

/* -------------------------------- sequence -------------------------------- */

type SeqCtx = {
  n: number;
  k: number;
  answer: number;
  /** A single position, e.g. "wheel". */
  position: string;
  /** The repeated options, e.g. "symbols". */
  option: string;
  params: Params;
};

function seqAi(c: SeqCtx, boxLabel: string, expected: number) {
  return { templateId: "sequence", boxLabel, expected, params: c.params };
}

/** Fill-the-formula style: nᵏ = base ^ exponent = result. */
export function sequenceBoxes(c: SeqCtx): {
  base: BoxInfo;
  exp: BoxInfo;
  res: BoxInfo;
} {
  return {
    base: {
      id: "seq-base",
      title: "The base (n)",
      text: `Each ${c.position} can be any of the same ${c.n} ${c.option}, so the base is n = ${c.n}.`,
      ai: seqAi(c, "base n", c.n),
    },
    exp: {
      id: "seq-exp",
      title: "The exponent (k)",
      text: `There are ${c.k} ${c.position}s, each chosen independently, so the exponent is k = ${c.k}.`,
      ai: seqAi(c, "exponent k", c.k),
    },
    res: {
      id: "seq-res",
      title: "The result",
      text: `${c.n}^${c.k} = ${c.answer.toLocaleString()} possible outcomes.`,
      ai: seqAi(c, "result", c.answer),
    },
  };
}

/* -------------------------------- multiset -------------------------------- */

type MultCtx = {
  n: number;
  k: number;
  answer: number;
  /** What is being chosen, e.g. "scoops". */
  pick: string;
  /** The pool of kinds, e.g. "flavors". */
  kind: string;
  params: Params;
};

function multAi(c: MultCtx, boxLabel: string, expected: number) {
  return { templateId: "multiset", boxLabel, expected, params: c.params };
}

/** Fill-the-formula style: C(n + k − 1, k). */
export function multisetBoxes(c: MultCtx): {
  top: BoxInfo;
  bottom: BoxInfo;
  res: BoxInfo;
} {
  const top = c.k + c.n - 1;
  const bottom = c.n - 1;
  return {
    top: {
      id: "mult-top",
      title: "C(k + n − 1, n − 1): the top",
      text: `Add the ${c.k} ${c.pick} and ${c.n} ${c.kind}, then subtract 1: k + n − 1 = ${c.k} + ${c.n} − 1 = ${top}.`,
      ai: multAi(c, "top k + n − 1", top),
    },
    bottom: {
      id: "mult-bottom",
      title: "C(k + n − 1, n − 1): the n − 1",
      text: `The bottom is the dividers between the ${c.kind}: n − 1 = ${c.n} − 1 = ${bottom}.`,
      ai: multAi(c, "bottom n − 1", bottom),
    },
    res: {
      id: "mult-res",
      title: "The result",
      text: `C(${top}, ${bottom}) = ${c.answer.toLocaleString()}.`,
      ai: multAi(c, "result", c.answer),
    },
  };
}

/* ------------------------------- distribute ------------------------------- */

type DistCtx = {
  items: number;
  bins: number;
  answer: number;
  /** The identical objects, e.g. "marbles". */
  item: string;
  /** The distinct destinations, e.g. "jars". */
  bin: string;
  params: Params;
};

function distAi(c: DistCtx, boxLabel: string, expected: number) {
  return { templateId: "distribute", boxLabel, expected, params: c.params };
}

/** Fill-the-formula style: distributing = C(items + bins − 1, bins − 1). */
export function distributeBoxes(c: DistCtx): {
  top: BoxInfo;
  bottom: BoxInfo;
  res: BoxInfo;
} {
  const top = c.items + c.bins - 1;
  const bottom = c.bins - 1;
  return {
    top: {
      id: "dist-top",
      title: "C(items + bins − 1, bins − 1): the top",
      text: `Add the ${c.items} ${c.item} and ${c.bins} ${c.bin}, then subtract 1: ${c.items} + ${c.bins} − 1 = ${top}.`,
      ai: distAi(c, "top items + bins − 1", top),
    },
    bottom: {
      id: "dist-bottom",
      title: "… the bins − 1",
      text: `Distributing into ${c.bins} ${c.bin} needs ${c.bins} − 1 = ${bottom} dividers, so the bottom is bins − 1 = ${bottom}.`,
      ai: distAi(c, "bottom bins − 1", bottom),
    },
    res: {
      id: "dist-res",
      title: "The result",
      text: `C(${top}, ${bottom}) = ${c.answer.toLocaleString()} ways.`,
      ai: distAi(c, "result", c.answer),
    },
  };
}
