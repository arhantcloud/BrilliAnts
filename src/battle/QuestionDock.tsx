/**
 * The combat question panel. When an enemy is targeted it generates ONE fresh
 * question for that enemy's lane topic (the lesson template for a normal enemy,
 * the harder upgrade template for an elite) and renders the topic's interactive
 * view. A correct answer defeats the enemy (freeing the lane's guard to resume
 * its march); a wrong answer leaves it attacking. The dock auto-closes shortly
 * after a result so the real-time pace keeps going.
 */

import { useEffect, useMemo, useState } from "react";
import { createRng } from "../quiz/rng";
import { getTemplate } from "../quiz/registry";
import { getUpgradeTemplate } from "../quiz/templates/upgrades/registry";
import { shortTitle } from "../content/shortTitles";
import { topicAccent } from "../army/config";
import { eliteTemplateFor, lessonTemplateFor } from "./config";
import type { LiveEnemy } from "./engine";

type Phase = "asking" | "defeated" | "miss";

const CLOSE_DELAY_MS = 1100;

export default function QuestionDock({
  target,
  onDefeat,
  onClose,
}: {
  target: LiveEnemy | null;
  onDefeat: (enemyId: string) => void;
  onClose: () => void;
}) {
  if (!target) return null;
  return (
    <DockInner
      key={target.id}
      enemy={target}
      onDefeat={onDefeat}
      onClose={onClose}
    />
  );
}

function DockInner({
  enemy,
  onDefeat,
  onClose,
}: {
  enemy: LiveEnemy;
  onDefeat: (enemyId: string) => void;
  onClose: () => void;
}) {
  const topicId = enemy.topicId;
  const accent = topicAccent(topicId);
  const topicLabel = shortTitle(topicId, topicId);

  const templateId = enemy.elite
    ? eliteTemplateFor(topicId)
    : lessonTemplateFor(topicId);
  const spec = useMemo(() => {
    if (!templateId) return undefined;
    return enemy.elite
      ? getUpgradeTemplate(templateId)
      : getTemplate(templateId);
  }, [templateId, enemy.elite]);

  const question = useMemo(() => spec?.generate(createRng()), [spec]);
  const [phase, setPhase] = useState<Phase>("asking");

  useEffect(() => {
    if (phase === "asking") return;
    const t = setTimeout(onClose, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  function handleResult(correct: boolean) {
    if (!correct) {
      setPhase("miss");
      return;
    }
    onDefeat(enemy.id);
    setPhase("defeated");
  }

  const Comp = spec?.Component;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#f7f1ea] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 text-white"
          style={{ backgroundColor: accent }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">
              {enemy.elite ? "Elite attacker" : "Attacker"} · {topicLabel}
            </p>
            <p className="truncate text-sm font-extrabold">
              Answer to make your {topicLabel} guard strike it down
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close question"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {Comp && question ? (
            <Comp
              question={question}
              locked={phase !== "asking"}
              onResult={handleResult}
            />
          ) : (
            <p className="py-8 text-center text-sm font-semibold text-stone-500">
              This enemy has no question template.
            </p>
          )}

          {phase === "defeated" && (
            <div className="mt-4 rounded-2xl bg-lime-100 px-4 py-3 text-sm font-bold text-lime-800 ring-1 ring-lime-300">
              Enemy down! Your guard pushes onward.
            </div>
          )}
          {phase === "miss" && (
            <div className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800 ring-1 ring-red-200">
              Missed! It keeps hammering your guard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
