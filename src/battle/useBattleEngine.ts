/**
 * React wrapper around the pure {@link engine}. Drives `step` from a
 * requestAnimationFrame loop (capped dt so a backgrounded tab doesn't teleport
 * enemies) and exposes the live three-lane battle to the UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BattleLevel, LanePick } from "./config";
import {
  defeatEnemy as defeatEnemyPure,
  initBattle,
  step,
  survivingLanes,
  type BattleStatus,
  type Lane,
  type LiveEnemy,
} from "./engine";

export type UseBattleEngine = {
  lanes: Lane[];
  enemies: LiveEnemy[];
  status: BattleStatus;
  surviving: number;
  targetId: string | null;
  setTarget: (id: string | null) => void;
  defeatEnemy: (enemyId: string) => void;
  restart: () => void;
};

const MAX_FRAME_MS = 100;

export function useBattleEngine(
  level: BattleLevel,
  picks: LanePick[],
): UseBattleEngine {
  const [state, setState] = useState(() => initBattle(level, picks));
  const [targetId, setTargetId] = useState<string | null>(null);

  // Keep the latest picks for restart without re-initialising every render.
  const picksRef = useRef(picks);
  useEffect(() => {
    picksRef.current = picks;
  }, [picks]);

  useEffect(() => {
    if (state.status !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(MAX_FRAME_MS, now - last);
      last = now;
      if (dt > 0) setState((s) => step(s, dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.status]);

  const defeatEnemy = useCallback((enemyId: string) => {
    setState((s) => defeatEnemyPure(s, enemyId));
    setTargetId((cur) => (cur === enemyId ? null : cur));
  }, []);

  const restart = useCallback(() => {
    setState(initBattle(level, picksRef.current));
    setTargetId(null);
  }, [level]);

  return {
    lanes: state.lanes,
    enemies: state.enemies,
    status: state.status,
    surviving: survivingLanes(state),
    targetId,
    setTarget: setTargetId,
    defeatEnemy,
    restart,
  };
}
