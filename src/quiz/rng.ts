/**
 * Tiny seedable RNG + combinatorics helpers used by the quiz templates.
 *
 * Templates call `generate(rng)` to produce a fresh, randomized question per
 * attempt. Seeding (via `createRng(seed)`) keeps generation deterministic for
 * tests; with no seed it falls back to `Math.random` for real attempts.
 */
export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [min, max] inclusive. */
  int: (min: number, max: number) => number;
  /** Uniformly pick one element of a non-empty array. */
  pick: <T>(arr: readonly T[]) => T;
  /** Coin flip. */
  bool: () => boolean;
};

export function createRng(seed?: number): Rng {
  let gen: () => number;
  if (seed === undefined) {
    gen = Math.random;
  } else {
    // mulberry32: small, fast, good enough for question variety.
    let s = seed >>> 0;
    gen = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const next = () => gen();
  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)];
  const bool = () => next() < 0.5;
  return { next, int, pick, bool };
}

/* --------------------------- combinatorics helpers -------------------------- */

export function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

/** Permutations P(n, k) = n! / (n - k)!, ordered, no repeats. */
export function permutations(n: number, k: number): number {
  let acc = 1;
  for (let i = 0; i < k; i++) acc *= n - i;
  return acc;
}

/**
 * Combinations C(n, k), unordered, no repeats. Computed multiplicatively so
 * the running value stays an exact integer (no factorial overflow / rounding).
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let acc = 1;
  for (let i = 1; i <= kk; i++) {
    acc = (acc * (n - kk + i)) / i;
  }
  return Math.round(acc);
}

/** n^k, ordered, with repeats. */
export function power(n: number, k: number): number {
  return n ** k;
}

/**
 * Stars-and-bars: number of ways to distribute `items` identical objects into
 * `bins` distinct bins = C(items + bins - 1, bins - 1). Always an integer.
 */
export function multisets(items: number, bins: number): number {
  return combinations(items + bins - 1, bins - 1);
}

/**
 * Circular permutations of `n` distinct items around a ring = (n - 1)!.
 * Rotations of the same cycle count once (there is no fixed "first" seat).
 */
export function circular(n: number): number {
  return factorial(Math.max(0, n - 1));
}
