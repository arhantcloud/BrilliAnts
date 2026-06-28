/**
 * Win/lose overlay shown when a battle ends. On a win it records the result
 * once (best stars via context) and offers Next / Replay / Back; on a loss it
 * offers Retry / Back. Stars equal the number of colonies still standing.
 */

import { useEffect, useRef } from "react";
import { useProgress } from "../progress/progress-context";
import { starsForSurviving } from "./config";
import type { BattleStatus } from "./engine";

function Stars({ count }: { count: 0 | 1 | 2 | 3 }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      aria-label={`${count} of 3 stars`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`text-4xl leading-none ${
            i < count ? "text-amber-400 drop-shadow" : "text-stone-300"
          }`}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function BattleResult({
  status,
  levelId,
  surviving,
  hasNext,
  onNext,
  onReplay,
  onBack,
}: {
  status: BattleStatus;
  levelId: string;
  /** Colonies (lanes) still standing at the end. */
  surviving: number;
  hasNext: boolean;
  onNext: () => void;
  onReplay: () => void;
  onBack: () => void;
}) {
  const { recordBattleResult } = useProgress();
  const won = status === "won";
  const stars = won ? starsForSurviving(surviving) : 0;
  const recorded = useRef(false);

  useEffect(() => {
    if (won && !recorded.current) {
      recorded.current = true;
      recordBattleResult(levelId, stars, Math.round((surviving / 3) * 100));
    }
  }, [won, levelId, stars, surviving, recordBattleResult]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#f7f1ea] p-6 text-center shadow-2xl">
        <p className="text-5xl" aria-hidden>
          {won ? "🏆" : "🛡️"}
        </p>
        <h2 className="mt-2 text-xl font-extrabold text-stone-800">
          {won ? "Breakthrough!" : "All anthills claimed"}
        </h2>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          {won
            ? `You reached the enemy base with ${surviving} ${
                surviving === 1 ? "colony" : "colonies"
              } still standing.`
            : "The enemy overran every lane. Train more ants and try again."}
        </p>

        {won && (
          <div className="mt-4">
            <Stars count={stars} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {won && hasNext && (
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-[#4d7a30] px-4 py-3 font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              Next level →
            </button>
          )}
          <button
            type="button"
            onClick={onReplay}
            className={`w-full rounded-xl px-4 py-3 font-bold transition active:scale-[0.98] ${
              won
                ? "bg-white text-[#4d7a30] ring-1 ring-[#4d7a30]/30 hover:bg-lime-50"
                : "bg-[#4d7a30] text-white hover:brightness-110"
            }`}
          >
            {won ? "Replay" : "Retry"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl bg-stone-100 px-4 py-3 font-bold text-stone-600 transition hover:bg-stone-200 active:scale-[0.98]"
          >
            Back to levels
          </button>
        </div>
      </div>
    </div>
  );
}
