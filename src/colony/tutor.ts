import { course } from "../content/course";
import { describeProblem } from "./problemType";
import type { Mistake } from "../types";

/**
 * OpenAI access for the Ant Colony "Ask Andi" tutor.
 *
 * WARNING: the key is read from `VITE_OPENAI_API_KEY` and Vite inlines `VITE_*`
 * vars into the shipped bundle, so this key is PUBLICLY EXTRACTABLE from the
 * deployed site. Use a usage-capped / restricted key here, and rotate it if it
 * leaks. The secure alternative is a server-side proxy that holds the key.
 */
const OPENAI_API_KEY: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

/** Cap on how many relevant slides a targeted review may replay. */
const MAX_SLIDES = 2;

/** Whether the AI tutor can call OpenAI (true only in local dev with a key). */
export function isTutorAiEnabled(): boolean {
  return typeof OPENAI_API_KEY === "string" && OPENAI_API_KEY.length > 0;
}

/** One deduped problem type missed in a nest, with how many ants share it. */
export type TutorTopic = {
  templateId: string;
  style?: number;
  label: string;
  count: number;
};

/** A lesson slide offered to the model / replayed in the modal. */
export type TutorSlide = {
  /** Custom-slide registry key (see customSlideRegistry). */
  component: string;
  title?: string;
};

/** Everything the tutor needs about a nest to build a targeted lesson. */
export type NestContext = {
  lessonId: string;
  lessonTitle: string;
  lessonSummary: string;
  topics: TutorTopic[];
  slideCatalog: TutorSlide[];
};

/** Worked example for one of the missed problem types. */
export type WorkedExample = {
  prompt: string;
  steps: string[];
  answer: string;
};

/** The targeted mini-lesson rendered in the modal. */
export type TutorLesson = {
  explanation: string;
  workedExample: WorkedExample | null;
  /** Component keys (subset of the lesson's slides), most relevant first. */
  recommendedSlides: string[];
};

/**
 * Build the tutor context for a nest from the course definition and the nest's
 * outstanding mistakes (ants). Dedupes mistakes by template + style so each
 * distinct missed problem type appears once with a count.
 */
export function buildNestContext(lessonId: string, ants: Mistake[]): NestContext {
  const lesson = course.lessons.find((l) => l.id === lessonId);

  const byType = new Map<string, TutorTopic>();
  for (const ant of ants) {
    const key = `${ant.templateId}:${ant.style ?? "-"}`;
    const existing = byType.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byType.set(key, {
        templateId: ant.templateId,
        style: ant.style,
        label: describeProblem(ant),
        count: 1,
      });
    }
  }

  return {
    lessonId,
    lessonTitle: lesson?.title ?? lessonId,
    lessonSummary: lesson?.summary ?? "",
    topics: [...byType.values()],
    slideCatalog: (lesson?.slides ?? []).map((s) => ({
      component: s.component,
      title: s.title,
    })),
  };
}

const SYSTEM_PROMPT =
  "You are Andi, a warm, encouraging ant tutor inside a combinatorics learning " +
  "app for teenagers. A learner missed some quiz questions in one lesson. Write " +
  "a short, focused mini-lesson that targets ONLY the specific problem types they " +
  "missed. Be concrete and build intuition; assume no advanced vocabulary. " +
  "Respond with STRICT JSON only (no markdown, no prose outside the JSON) using " +
  "exactly this shape: " +
  '{"explanation": string, "workedExample": {"prompt": string, "steps": string[], ' +
  '"answer": string}, "recommendedSlides": string[]}. ' +
  "The explanation should be 2-3 short paragraphs separated by \\n\\n. " +
  "The workedExample should walk through ONE concrete problem of a missed type, " +
  "with 2-5 short steps. recommendedSlides must be chosen ONLY from the provided " +
  "slide component keys, AT MOST 3, ordered most-relevant first. No greetings or " +
  "sign-offs.";

function buildUserPrompt(ctx: NestContext): string {
  const topics = ctx.topics
    .map((t) => `- ${t.label} (templateId=${t.templateId}, missed ${t.count}x)`)
    .join("\n");
  const slides = ctx.slideCatalog
    .map((s) => `- ${s.component}${s.title ? ` ("${s.title}")` : ""}`)
    .join("\n");
  return [
    `Lesson: ${ctx.lessonTitle}`,
    ctx.lessonSummary ? `Lesson summary: ${ctx.lessonSummary}` : "",
    "",
    "Problem types the learner missed:",
    topics || "- (none)",
    "",
    "Available lesson slides (choose recommendedSlides from these component keys):",
    slides || "- (none)",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Authored, offline-safe lesson used whenever the AI call is unavailable. */
export function authoredFallback(ctx: NestContext): TutorLesson {
  const labels = ctx.topics
    .map((t) => (t.count > 1 ? `${t.label} (×${t.count})` : t.label))
    .join(", ");
  const explanation = [
    ctx.lessonSummary,
    labels
      ? `You slipped up on: ${labels}. Replay the key slides below to rebuild your intuition, then send the ants home.`
      : "Replay the key slides below to rebuild your intuition.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    explanation,
    workedExample: null,
    recommendedSlides: ctx.slideCatalog.map((s) => s.component).slice(0, MAX_SLIDES),
  };
}

/**
 * Coerce an arbitrary parsed JSON value into a valid {@link TutorLesson},
 * validating recommended slides against the lesson's real slides and falling
 * back to authored content for any missing/invalid field.
 */
function normalize(raw: unknown, ctx: NestContext): TutorLesson {
  const fallback = authoredFallback(ctx);
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;

  const explanation =
    typeof obj.explanation === "string" && obj.explanation.trim().length > 0
      ? obj.explanation.trim()
      : fallback.explanation;

  let workedExample: WorkedExample | null = null;
  const we = obj.workedExample;
  if (we && typeof we === "object") {
    const w = we as Record<string, unknown>;
    const prompt = typeof w.prompt === "string" ? w.prompt.trim() : "";
    const steps = Array.isArray(w.steps)
      ? w.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [];
    const answer =
      typeof w.answer === "string"
        ? w.answer.trim()
        : typeof w.answer === "number"
          ? String(w.answer)
          : "";
    if (prompt && steps.length > 0) {
      workedExample = { prompt, steps, answer };
    }
  }

  const valid = new Set(ctx.slideCatalog.map((s) => s.component));
  const recommended = Array.isArray(obj.recommendedSlides)
    ? obj.recommendedSlides.filter(
        (s): s is string => typeof s === "string" && valid.has(s),
      )
    : [];
  const recommendedSlides = (
    recommended.length > 0 ? recommended : fallback.recommendedSlides
  ).slice(0, MAX_SLIDES);

  return { explanation, workedExample, recommendedSlides };
}

/**
 * Generate a targeted mini-lesson for a nest. Always resolves to a usable
 * {@link TutorLesson}: it calls OpenAI directly when the local-dev key is set,
 * and otherwise (or on any network/parse error) returns the authored fallback.
 */
export async function generateTutorLesson(ctx: NestContext): Promise<TutorLesson> {
  if (!isTutorAiEnabled()) return authoredFallback(ctx);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(ctx) },
        ],
      }),
    });
    if (!res.ok) return authoredFallback(ctx);
    const data = await res.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return authoredFallback(ctx);
    return normalize(JSON.parse(content), ctx);
  } catch {
    return authoredFallback(ctx);
  }
}
