import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MascotProvider } from "./MascotContext";
import { useMascot, type AntStop } from "./mascot-context";

const stops: AntStop[] = [
  { id: "box-a", title: "Box A", text: "Explanation A" },
  { id: "box-b", title: "Box B", text: "Explanation B" },
];

function wrapper({ children }: { children: ReactNode }) {
  return <MascotProvider>{children}</MascotProvider>;
}

describe("MascotContext box tour", () => {
  it("starts inactive (ant off screen)", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });
    expect(result.current.active).toBe(false);
    expect(result.current.current).toBeNull();
  });

  it("ignores an empty review", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });
    act(() => result.current.reviewBoxes([]));
    expect(result.current.active).toBe(false);
  });

  it("walks through each incorrect box in order, then finishes", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });

    act(() => result.current.reviewBoxes(stops));
    expect(result.current.active).toBe(true);
    expect(result.current.index).toBe(0);
    expect(result.current.current?.id).toBe("box-a");
    expect(result.current.message).toBe("Explanation A");

    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.current?.id).toBe("box-b");
    expect(result.current.message).toBe("Explanation B");

    // Advancing past the last box ends the tour.
    act(() => result.current.next());
    expect(result.current.active).toBe(false);
  });

  it("can step back to a previous box", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });
    act(() => result.current.reviewBoxes(stops));
    act(() => result.current.next());
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    expect(result.current.current?.id).toBe("box-a");
  });

  it("dismiss sends the ant off screen", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });
    act(() => result.current.reviewBoxes(stops));
    act(() => result.current.dismiss());
    expect(result.current.active).toBe(false);
    expect(result.current.message).toBeNull();
  });

  it("does not offer Explain more without a model (Firebase disabled in tests)", () => {
    const { result } = renderHook(() => useMascot(), { wrapper });
    act(() =>
      result.current.reviewBoxes([
        {
          id: "box-ai",
          title: "Box",
          text: "Authored",
          ai: { templateId: "permutation", boxLabel: "k", expected: 3, params: {} },
        },
      ]),
    );
    expect(result.current.canExplainMore).toBe(false);
  });
});
