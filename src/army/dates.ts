/**
 * Local-calendar date helpers shared by the streak logic and the Ant Army's
 * one-day upgrade gate. Kept framework-free so both the ProgressContext and the
 * army UI can import them without pulling in React.
 */

/** Local calendar date (yyyy-mm-dd) so gates follow the user's day, not UTC. */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole calendar days from date `a` to date `b` (both yyyy-mm-dd). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
