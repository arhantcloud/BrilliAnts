import { createContext, useContext } from "react";

/**
 * Optional context handed to "Explain more" so the mascot can ask Gemini for a
 * deeper, box-specific explanation. No learner PII, only the generated
 * question's parameters and what the box should contain.
 */
export type AntBoxAiContext = {
  templateId: string;
  boxLabel: string;
  expected: number | string;
  params: Record<string, number | string>;
};

/**
 * One stop on the ant's tour of a learner's mistakes. `id` matches a
 * `data-ant-box="..."` attribute on the incorrect element so the mascot can find
 * it in the DOM and walk over to it.
 */
export type AntStop = {
  id: string;
  /** Short label for the box, shown as the bubble heading. */
  title: string;
  /** Authored explanation: the exact error and how to get the right value. */
  text: string;
  /** Optional context enabling a Gemini "Explain more" escalation. */
  ai?: AntBoxAiContext;
  /**
   * Applies the correct value to this box and flags it as corrected (the box
   * turns yellow-green). Called by the ant when the learner clicks Next / Got it.
   */
  fix?: () => void;
};

export type MascotContextValue = {
  /** True while the ant is touring a set of incorrect boxes. */
  active: boolean;
  stops: AntStop[];
  index: number;
  current: AntStop | null;
  /** True while a Gemini "Explain more" request is in flight. */
  thinking: boolean;
  /** Text currently shown in the bubble (authored or AI-expanded). */
  message: string | null;
  /** Whether the current box can be escalated to Gemini. */
  canExplainMore: boolean;
  /** Start a walk-through of the given incorrect boxes (no-op if empty). */
  reviewBoxes: (stops: AntStop[]) => void;
  /** Advance to the next box, or finish the tour after the last one. */
  next: () => void;
  /** Go back to the previous box. */
  prev: () => void;
  /** Ask Gemini to expand on the current box's explanation. */
  explainMore: () => void;
  /** End the tour and send the ant off screen. */
  dismiss: () => void;
};

export const MascotContext = createContext<MascotContextValue | undefined>(
  undefined,
);

/** Throws if used outside the provider, used by the mascot's own overlay. */
export function useMascot(): MascotContextValue {
  const ctx = useContext(MascotContext);
  if (!ctx) throw new Error("useMascot must be used within MascotProvider");
  return ctx;
}

/**
 * Non-throwing accessor for feature code (quiz templates). Returns `null` when
 * there's no provider (e.g. isolated component tests), so callers can safely
 * `mascot?.reviewBoxes(...)` without coupling every render path to the mascot.
 */
export function useMascotOptional(): MascotContextValue | null {
  return useContext(MascotContext) ?? null;
}
