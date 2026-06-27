import { describe, it, expect } from "vitest";
import { canEscalate, escalateBox } from "./coach";
import type { AntBoxAiContext } from "./mascot-context";

const ai: AntBoxAiContext = {
  templateId: "permutation",
  boxLabel: "denominator k",
  expected: 3,
  params: { n: 5, k: 3 },
};

describe("coach.canEscalate", () => {
  it("is false without AI context", () => {
    expect(canEscalate(undefined)).toBe(false);
  });

  it("is false when no model is available (Firebase disabled in tests)", () => {
    // getCoachModel() returns undefined without Firebase env, so escalation is off.
    expect(canEscalate(ai)).toBe(false);
  });
});

describe("coach.escalateBox", () => {
  it("falls back to the authored explanation when the model is unavailable", async () => {
    const fallback = "This box is k; it should be 3.";
    await expect(escalateBox(ai, fallback)).resolves.toBe(fallback);
  });
});
