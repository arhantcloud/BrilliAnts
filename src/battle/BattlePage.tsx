/**
 * Battle mode page. Two stages: pick a campaign level, then fight. The three
 * lanes are auto-selected from your strongest trained anthills — each fields a
 * guard ant (its highest rank, on its tiered hill) holding off enemies marching
 * from a single enemy base. Tap an attacker to answer its topic's question and
 * cut it down; a guard with a clear lane advances toward the enemy base. Break
 * through to win; lose every lane to lose; stars equal the colonies left
 * standing.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../progress/progress-context";
import {
  BATTLE_LEVELS,
  BATTLE_TOPIC_IDS,
  guardHp,
  type BattleLevel,
  type LanePick,
} from "./config";
import { useBattleEngine } from "./useBattleEngine";
import BattleField from "./BattleField";
import QuestionDock from "./QuestionDock";
import BattleResult from "./BattleResult";

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/15 text-white hover:bg-black/25"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function StarRow({ count, size = "text-base" }: { count: number; size?: string }) {
  return (
    <span aria-label={`${count} of 3 stars`} className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${size} leading-none ${
            i < count ? "text-amber-400" : "text-white/30"
          }`}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

type Stage = { kind: "levels" } | { kind: "fight"; levelId: string };

export default function BattlePage() {
  const navigate = useNavigate();
  const { battleProgress } = useProgress();
  const [stage, setStage] = useState<Stage>({ kind: "levels" });

  if (stage.kind === "fight") {
    const level = BATTLE_LEVELS.find((l) => l.id === stage.levelId)!;
    return (
      <BattleRun
        key={level.id}
        level={level}
        onExit={() => setStage({ kind: "levels" })}
        onNextLevel={(id) => setStage({ kind: "fight", levelId: id })}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#2a1a0e]">
      <header className="bg-gradient-to-r from-[#5f8f3c] to-[#4d7a30] px-5 pb-6 pt-8 text-white shadow-md sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate("/")} label="Back to course" />
            <div>
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-lime-100">
                <span aria-hidden>⚔️</span> Battle
              </p>
              <h1 className="mt-0.5 text-xl font-extrabold leading-tight drop-shadow-sm">
                March on the enemy base
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-prose text-sm leading-snug text-lime-50">
            Your three strongest anthills take the field automatically. Each
            guard holds a lane: tap an attacker, answer its topic, and your guard
            strikes it down. Clear a lane and the guard marches on. Break through
            to win — lose all three and the base falls.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <ul className="space-y-4">
            {BATTLE_LEVELS.map((lvl, i) => {
              const prev = BATTLE_LEVELS[i - 1];
              const unlocked = i === 0 || !!battleProgress[prev.id];
              const best = battleProgress[lvl.id];
              const stars = best?.stars ?? 0;
              return (
                <li key={lvl.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setStage({ kind: "fight", levelId: lvl.id })}
                    className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left shadow-md transition ${
                      unlocked
                        ? "bg-gradient-to-br from-[#5f8f3c] to-[#4d7a30] text-white hover:shadow-lg active:scale-[0.99]"
                        : "bg-stone-800/60 text-stone-400"
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${
                        unlocked ? "bg-black/20 text-white" : "bg-black/30"
                      }`}
                    >
                      {unlocked ? i + 1 : "🔒"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-lime-100">
                        Level {i + 1}
                      </p>
                      <p className="truncate text-lg font-extrabold">
                        {lvl.name}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-lime-50/90">
                        {unlocked
                          ? best
                            ? `Best: ${best.stars}/3 colonies held`
                            : "Not cleared yet"
                          : `Clear level ${i} to unlock`}
                      </p>
                    </div>
                    {unlocked && <StarRow count={stars} size="text-xl" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}

function BattleRun({
  level,
  onExit,
  onNextLevel,
}: {
  level: BattleLevel;
  onExit: () => void;
  onNextLevel: (levelId: string) => void;
}) {
  const { antArmy } = useProgress();

  // Auto-select the three lanes: trained anthills, strongest guard first
  // (ties broken by the canonical topic order), top 3.
  const lanePicks = useMemo<LanePick[]>(() => {
    const eligible = BATTLE_TOPIC_IDS.filter(
      (t) => (antArmy[t]?.length ?? 0) > 0,
    );
    const sorted = [...eligible].sort((a, b) => {
      const diff = guardHp(antArmy[b] ?? []) - guardHp(antArmy[a] ?? []);
      if (diff !== 0) return diff;
      return BATTLE_TOPIC_IDS.indexOf(a) - BATTLE_TOPIC_IDS.indexOf(b);
    });
    return sorted
      .slice(0, 3)
      .map((t) => ({ topicId: t, ants: antArmy[t] ?? [] }));
  }, [antArmy]);

  const {
    lanes,
    enemies,
    status,
    surviving,
    targetId,
    setTarget,
    defeatEnemy,
    restart,
  } = useBattleEngine(level, lanePicks);

  const target = useMemo(
    () => enemies.find((e) => e.id === targetId) ?? null,
    [enemies, targetId],
  );

  const levelIndex = BATTLE_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = BATTLE_LEVELS[levelIndex + 1];

  if (lanePicks.length < 3) {
    return (
      <div className="flex h-full flex-col bg-[#2a1a0e]">
        <header className="bg-gradient-to-r from-[#5f8f3c] to-[#4d7a30] px-5 pb-4 pt-8 text-white shadow-md sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-center gap-3">
              <BackButton onClick={onExit} label="Back to levels" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-lime-100">
                  <span aria-hidden>⚔️</span> Level {levelIndex + 1}
                </p>
                <h1 className="mt-0.5 truncate text-xl font-extrabold leading-tight drop-shadow-sm">
                  {level.name}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-2xl bg-amber-50 p-6 text-center ring-1 ring-amber-200">
              <p className="text-3xl">🐜</p>
              <p className="mt-2 font-bold text-amber-800">
                Train at least 3 anthills to march to battle
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Recruit ants into three different topics, then come back to lead
                your strongest colonies onto the field.
              </p>
              <button
                type="button"
                onClick={onExit}
                className="mt-4 rounded-xl bg-[#4d7a30] px-4 py-2 font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
              >
                Back to levels
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#2a1a0e]">
      <header className="bg-gradient-to-r from-[#5f8f3c] to-[#4d7a30] px-5 pb-4 pt-8 text-white shadow-md sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <BackButton onClick={onExit} label="Back to levels" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-lime-100">
                <span aria-hidden>⚔️</span> Level {levelIndex + 1}
              </p>
              <h1 className="mt-0.5 truncate text-xl font-extrabold leading-tight drop-shadow-sm">
                {level.name}
              </h1>
            </div>
            <span className="rounded-full bg-black/25 px-3 py-1 text-sm font-bold">
              🏰 {surviving}/3
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Full-bleed unified battlefield. */}
        <BattleField
          lanes={lanes}
          enemies={enemies}
          targetId={targetId}
          setTarget={setTarget}
        />
        <p className="px-5 py-3 text-center text-sm font-semibold text-lime-100/70">
          {target
            ? "Answer to strike it down."
            : enemies.some((e) => e.engaged)
              ? "Tap an enemy locked with your guard to fight it."
              : "Your guards advance…"}
        </p>
      </main>

      <QuestionDock
        target={status === "playing" ? target : null}
        onDefeat={defeatEnemy}
        onClose={() => setTarget(null)}
      />

      {status !== "playing" && (
        <BattleResult
          status={status}
          levelId={level.id}
          surviving={surviving}
          hasNext={!!nextLevel}
          onNext={() => nextLevel && onNextLevel(nextLevel.id)}
          onReplay={restart}
          onBack={onExit}
        />
      )}
    </div>
  );
}
