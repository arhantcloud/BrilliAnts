import { useCallback, useRef, useState, type ReactNode } from "react";
import { canEscalate, escalateBox } from "./coach";
import {
  MascotContext,
  type AntStop,
  type MascotContextValue,
} from "./mascot-context";

export function MascotProvider({ children }: { children: ReactNode }) {
  const [stops, setStops] = useState<AntStop[]>([]);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  // Bumped on every navigation/dismiss so a slow Gemini response can't land on
  // the wrong box after the learner has moved on.
  const reqId = useRef(0);

  const active = stops.length > 0;
  const current = active ? (stops[index] ?? null) : null;
  const canExplainMore =
    !thinking && Boolean(current) && canEscalate(current?.ai);

  const goTo = useCallback((next: AntStop[], i: number) => {
    reqId.current += 1;
    setThinking(false);
    setStops(next);
    setIndex(i);
    setMessage(next[i]?.text ?? null);
  }, []);

  const dismiss = useCallback(() => {
    reqId.current += 1;
    setThinking(false);
    setStops([]);
    setIndex(0);
    setMessage(null);
  }, []);

  const reviewBoxes = useCallback(
    (next: AntStop[]) => {
      if (next.length === 0) return;
      goTo(next, 0);
    },
    [goTo],
  );

  const next = useCallback(() => {
    if (index + 1 >= stops.length) dismiss();
    else goTo(stops, index + 1);
  }, [index, stops, goTo, dismiss]);

  const prev = useCallback(() => {
    if (index > 0) goTo(stops, index - 1);
  }, [index, stops, goTo]);

  const explainMore = useCallback(() => {
    if (!current?.ai) return;
    const id = ++reqId.current;
    const fallback = current.text;
    setThinking(true);
    escalateBox(current.ai, fallback).then((text) => {
      if (reqId.current !== id) return; // superseded
      setMessage(text);
      setThinking(false);
    });
  }, [current]);

  const value: MascotContextValue = {
    active,
    stops,
    index,
    current,
    thinking,
    message,
    canExplainMore,
    reviewBoxes,
    next,
    prev,
    explainMore,
    dismiss,
  };

  return (
    <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
  );
}
