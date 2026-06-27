import { getCoachModel } from "../firebase";
import type { AntBoxAiContext } from "./mascot-context";

/**
 * Optional AI layer for the ant. The authored box explanation
 * (see boxExplanations.ts) is always shown first: free, instant, offline-safe.
 * Only an explicit "Explain more" tap escalates to Gemini via Firebase AI Logic,
 * and any failure (offline, Firebase disabled, quota) falls back to that
 * authored text, so the ant always says something useful.
 */

const COACH_SYSTEM_PROMPT =
  "You are Andi, a friendly, encouraging ant mascot inside a combinatorics " +
  "learning app for teenagers. The learner filled in one box of a worked " +
  "solution incorrectly. Explain, in at most two short sentences, what that " +
  "specific box represents and how to figure out its value. Be warm and " +
  "concrete. No greetings or sign-offs.";

/** Whether AI escalation is even possible for a stop (has context + a model). */
export function canEscalate(ai: AntBoxAiContext | undefined): boolean {
  return Boolean(ai) && Boolean(getCoachModel());
}

/**
 * Ask Gemini to expand on a single box. Always resolves to a usable string,
 * falling back to `fallback` (the authored explanation) on any problem.
 */
export async function escalateBox(
  ai: AntBoxAiContext,
  fallback: string,
): Promise<string> {
  const model = getCoachModel();
  if (!model) return fallback;
  try {
    const result = await model.generateContent(buildPrompt(ai));
    const text = result.response.text().trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}

function buildPrompt(ai: AntBoxAiContext): string {
  return [
    COACH_SYSTEM_PROMPT,
    "",
    `Problem type: ${ai.templateId}.`,
    `Question parameters: ${JSON.stringify(ai.params)}.`,
    `The box "${ai.boxLabel}" should contain: ${ai.expected}.`,
    "Explain what this box means and how to arrive at that value.",
  ].join("\n");
}
