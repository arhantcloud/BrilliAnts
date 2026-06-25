import { describe, it, expect } from "vitest";
import { course } from "./course";
import { customSlideRegistry } from "../components/slides/custom/registry";
import type { Slide } from "../types";

describe("course content integrity", () => {
  it("has a non-empty course with lessons", () => {
    expect(course.lessons.length).toBeGreaterThan(0);
    expect(course.title.trim().length).toBeGreaterThan(0);
  });

  it("has unique lesson ids", () => {
    const ids = course.lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every lesson at least one slide and metadata", () => {
    for (const lesson of course.lessons) {
      expect(lesson.slides.length).toBeGreaterThan(0);
      expect(lesson.title.trim().length).toBeGreaterThan(0);
      expect(lesson.summary.trim().length).toBeGreaterThan(0);
      expect(lesson.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it("has globally unique slide ids", () => {
    const slideIds = course.lessons.flatMap((l) => l.slides.map((s) => s.id));
    expect(new Set(slideIds).size).toBe(slideIds.length);
  });
});

const allSlides: Slide[] = course.lessons.flatMap((l) => l.slides);

describe("slide validity by type", () => {
  it("custom slides reference a registered component", () => {
    for (const slide of allSlides) {
      expect(
        customSlideRegistry[slide.component],
        `missing registry entry for "${slide.component}"`,
      ).toBeDefined();
    }
  });
});

describe("custom slide registry", () => {
  it("maps every key to a defined component function", () => {
    for (const [key, Comp] of Object.entries(customSlideRegistry)) {
      expect(typeof Comp, `entry "${key}" should be a component`).toBe(
        "function",
      );
    }
  });

  it("has no registry entries that are obviously empty keys", () => {
    for (const key of Object.keys(customSlideRegistry)) {
      expect(key.trim().length).toBeGreaterThan(0);
    }
  });
});
