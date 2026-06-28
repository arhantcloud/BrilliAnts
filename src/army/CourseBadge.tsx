import { useState } from "react";
import { useProgress } from "../progress/progress-context";
import { FINAL_QUIZ_ID } from "../content/quizzes";
import {
  BADGES,
  MAX_STARS,
  WARLORD_INDEX,
  armyStars,
  currentBadgeIndex,
} from "./badges";

/** A circular emblem for a badge; dimmed + locked when not yet achieved. */
function Emblem({
  glyph,
  color,
  size = 36,
  achieved = true,
}: {
  glyph: string;
  color: string;
  size?: number;
  achieved?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: achieved
          ? `radial-gradient(circle at 35% 30%, #ffffff55, ${color})`
          : "#d6d3d1",
        boxShadow: achieved ? `0 0 0 2px ${color}55` : "inset 0 0 0 2px #b9b4af",
        fontSize: size * 0.5,
        lineHeight: 1,
        filter: achieved ? "none" : "grayscale(1) opacity(0.65)",
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

/**
 * The course rank badge shown next to the course title. Reflects how far the
 * Ant Army base has been upgraded; clicking it opens the full ladder, with
 * earned badges marked achieved and higher ones shown as locked.
 */
export default function CourseBadge() {
  const { anthillTier, quizResult } = useProgress();
  const [open, setOpen] = useState(false);

  const stars = armyStars(anthillTier);
  // Warlord additionally requires a perfect final exam.
  const finalResult = quizResult(FINAL_QUIZ_ID);
  const finalPerfect =
    !!finalResult &&
    finalResult.total > 0 &&
    finalResult.bestCorrect === finalResult.total;
  const idx = currentBadgeIndex(stars, finalPerfect);
  const badge = BADGES[idx];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 ring-1 ring-white/25 transition hover:brightness-110"
        style={{ backgroundColor: badge.color }}
        title={`Rank: ${badge.label} · ${stars}/${MAX_STARS}★ · tap to view all ranks`}
      >
        <Emblem glyph={badge.glyph} color={badge.color} size={39} />
        <span className="text-sm font-bold text-white">{badge.label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 text-stone-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-extrabold">Army ranks</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 text-stone-400 hover:text-stone-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs font-semibold text-stone-500">
              Army strength {stars} / {MAX_STARS}★ — each fortified anthill is
              1★, each fortress is 2★.
            </p>

            <ul className="flex flex-col gap-2">
              {BADGES.map((_, j) => BADGES.length - 1 - j).map((i) => {
                const b = BADGES[i];
                const achieved = i <= idx;
                const isCurrent = i === idx;
                return (
                  <li
                    key={b.id}
                    className={`flex items-center gap-3 rounded-xl p-2.5 ${
                      isCurrent
                        ? "bg-amber-50 ring-2 ring-amber-300"
                        : achieved
                          ? "bg-stone-50"
                          : "bg-stone-50/60"
                    }`}
                  >
                    <Emblem
                      glyph={b.glyph}
                      color={b.color}
                      size={40}
                      achieved={achieved}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-bold ${
                            achieved ? "text-stone-800" : "text-stone-400"
                          }`}
                        >
                          {b.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-800">
                            Current
                          </span>
                        )}
                      </div>
                      <p
                        className={`truncate text-[11px] font-semibold ${
                          achieved ? "text-stone-500" : "text-stone-400"
                        }`}
                      >
                        {b.blurb}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        achieved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {achieved
                        ? "Achieved"
                        : i === WARLORD_INDEX && stars >= MAX_STARS
                          ? "Final 100%"
                          : `${b.minStars}★`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
