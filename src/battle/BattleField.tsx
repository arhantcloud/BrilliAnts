/**
 * The battlefield as ONE unified field (no per-lane boxes): a single sky→grass
 * gradient. Each chosen anthill sits at the LEFT edge on its own horizontal
 * band; a single real enemy base sits on the RIGHT. Player guards walk RIGHT
 * toward the enemy base (facing right); enemies march LEFT toward the anthills
 * (facing left) and stop at the guard. Tapping an enemy routes to `setTarget`.
 *
 * Lanes are stacked vertically by band: lane `i` of `lanes.length` is centred at
 * `topPct = ((i + 0.5) / lanes.length) * 100`.
 */

import AntSvg from "../mascot/AntSvg";
import { AnthillMound } from "../army/Anthill";
import { topicAccent } from "../army/config";
import { shortTitle } from "../content/shortTitles";
import EnemySprite from "./EnemySprite";
import type { Lane, LiveEnemy } from "./engine";

function darken(hex: string, amount = 0.4): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#3a2017";
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** The player's guard ant: walks RIGHT toward the enemy base, so faces RIGHT. */
function GuardSprite({ lane, topPct }: { lane: Lane; topPct: number }) {
  const accent = topicAccent(lane.topicId);
  const hpPct = Math.max(0, (lane.guardHp / lane.guardMaxHp) * 100);
  return (
    <span
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${lane.guardPos * 100}%`, top: `${topPct}%`, width: 44 }}
    >
      <span className="mx-auto mb-1 block h-1.5 w-10 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/30">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${hpPct}%`,
            backgroundColor: hpPct > 40 ? "#9ade5a" : "#f6b24a",
          }}
        />
      </span>
      {/* Guard walks RIGHT toward the enemy base: rotate(90deg) faces right. */}
      <span className="block h-11 w-11" style={{ transform: "rotate(90deg)" }}>
        <AntSvg
          walking
          bodyColor={accent}
          bodyDarkColor={darken(accent)}
          className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
        />
      </span>
    </span>
  );
}

export default function BattleField({
  lanes,
  enemies,
  targetId,
  setTarget,
}: {
  lanes: Lane[];
  enemies: LiveEnemy[];
  targetId: string | null;
  setTarget: (id: string | null) => void;
}) {
  const count = Math.max(1, lanes.length);
  return (
    <div
      className="relative h-[360px] w-full overflow-hidden sm:h-[420px]"
      style={{
        background:
          "linear-gradient(180deg,#a7cf74 0%,#7cae54 55%,#5f8f3c 100%)",
      }}
    >
      {/* Single real enemy base on the right, vertically centred. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex w-[160px] items-center justify-center">
        <div className="relative h-[200px] w-[160px] origin-bottom scale-[0.7]">
          <AnthillMound tier={2} accent="#7a2f2f" idPrefix="enemy-base" />
        </div>
      </div>
      <span className="pointer-events-none absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-200">
        <span aria-hidden>💀</span> Enemy base
      </span>

      {lanes.map((lane, i) => {
        const topPct = ((i + 0.5) / count) * 100;
        const accent = topicAccent(lane.topicId);
        const laneEnemies = enemies.filter((e) => e.laneId === lane.id);
        return (
          <div key={lane.id}>
            {/* Home anthill at the LEFT edge of this lane's band (~110px wide). */}
            <div
              className="pointer-events-none absolute left-0 z-0 -translate-y-1/2"
              style={{ top: `${topPct}%`, height: 180, width: 180 }}
            >
              <div className="relative h-full w-full origin-bottom-left scale-[0.6]">
                <AnthillMound
                  tier={lane.tier}
                  accent={accent}
                  idPrefix={`battle-${lane.id}`}
                />
              </div>
            </div>

            {/* Lane label chip near the anthill. */}
            <span
              className="pointer-events-none absolute left-2 z-20 -translate-y-1/2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ top: `calc(${topPct}% - 44px)` }}
            >
              {shortTitle(lane.topicId, lane.topicId)}
            </span>

            {lane.claimed ? (
              <span
                className="pointer-events-none absolute left-16 z-20 -translate-y-1/2 rounded-full bg-stone-900/70 px-2 py-0.5 text-[11px] font-black text-white/80"
                style={{ top: `${topPct}%` }}
              >
                ⚑ claimed
              </span>
            ) : lane.guardDefeated ? (
              <span
                className="pointer-events-none absolute left-16 z-20 -translate-y-1/2 rounded-full bg-red-900/70 px-2 py-0.5 text-[11px] font-black text-red-100"
                style={{ top: `${topPct}%` }}
              >
                ⚠ unprotected
              </span>
            ) : (
              <>
                <GuardSprite lane={lane} topPct={topPct} />
                {lane.reached && (
                  <span
                    className="pointer-events-none absolute right-24 z-20 -translate-y-1/2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black text-amber-900"
                    style={{ top: `${topPct}%` }}
                  >
                    Breakthrough!
                  </span>
                )}
              </>
            )}

            {/* Live enemies in this lane, sitting on this band. */}
            {laneEnemies.map((enemy) => (
              <EnemySprite
                key={enemy.id}
                enemy={enemy}
                topPct={topPct}
                selected={enemy.id === targetId}
                onSelect={() => setTarget(enemy.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
