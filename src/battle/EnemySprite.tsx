/**
 * A single enemy ant within the unified battlefield, positioned by its progress
 * (1 at the enemy base on the right, decreasing toward the guard on the left)
 * and by its lane's vertical band (`topPct`). Hostile crimson so it reads
 * clearly against the player's topic-coloured guard. Enemies walk LEFT toward
 * the anthills, so the upright ant is rotated to face left. It can only be
 * tapped (to pose a question) once it has reached the guard and is fighting it;
 * while still marching in it is not interactive.
 */

import AntSvg from "../mascot/AntSvg";
import type { LiveEnemy } from "./engine";

const ENEMY_BODY = "#9b2f2f";
const ENEMY_BODY_DARK = "#5e1a1a";

export default function EnemySprite({
  enemy,
  topPct,
  selected,
  onSelect,
}: {
  enemy: LiveEnemy;
  /** Vertical band centre of this enemy's lane, as a percentage. */
  topPct: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const size = enemy.elite ? 50 : 36;
  // Only an enemy locked in combat with the guard can be answered.
  const selectable = enemy.engaged;

  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      aria-label={`${enemy.elite ? "Elite enemy" : "Enemy"}${
        selectable ? "" : " (out of reach)"
      }${selected ? " (targeted)" : ""}`}
      aria-pressed={selected}
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none ${
        selectable ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ left: `${enemy.pos * 100}%`, top: `${topPct}%`, width: size }}
    >
      <span
        className={`relative block rounded-full transition ${
          selected ? "ring-2 ring-amber-300" : ""
        } ${enemy.engaged ? "animate-pulse ring-2 ring-red-300/70" : ""}`}
        style={{ width: size, height: size }}
      >
        {/* Enemies face LEFT (toward the anthills): rotate(-90deg). */}
        <span
          className="block h-full w-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          <AntSvg
            walking={!enemy.engaged}
            bodyColor={ENEMY_BODY}
            bodyDarkColor={ENEMY_BODY_DARK}
            className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
          />
        </span>

        {enemy.elite && (
          <span
            className="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-amber-900 ring-1 ring-white/70"
            aria-hidden
          >
            ★
          </span>
        )}
      </span>
    </button>
  );
}
