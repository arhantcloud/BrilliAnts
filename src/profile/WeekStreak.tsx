/** Sunday-first day initials for the weekly streak row. */
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToday(): string {
  return localDateStr(new Date());
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/**
 * Weekly streak row: a hole for each day of the current week (Sun → Sat). Days
 * that fall inside the active streak window (the `currentStreak` consecutive
 * days ending on `lastActiveDate`) are filled green; today is ringed.
 */
export default function WeekStreak({
  currentStreak,
  lastActiveDate,
}: {
  currentStreak: number;
  lastActiveDate: string | null;
}) {
  const today = isoToday();
  const dow = new Date(today + "T00:00:00").getDay();
  const weekStart = addDays(today, -dow);
  const streakStart =
    lastActiveDate && currentStreak > 0
      ? addDays(lastActiveDate, -(currentStreak - 1))
      : null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const completed = Boolean(
      streakStart &&
        lastActiveDate &&
        date >= streakStart &&
        date <= lastActiveDate &&
        date <= today,
    );
    return { date, letter: DAY_LETTERS[i], completed, isToday: date === today };
  });

  return (
    <div
      className="flex items-center justify-between gap-1.5 rounded-xl bg-stone-100 px-3 py-2"
      aria-label={`Daily streak: ${currentStreak} day${currentStreak === 1 ? "" : "s"}`}
    >
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold uppercase leading-none text-stone-400">
            {d.letter}
          </span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
              d.completed
                ? "bg-lime-500 text-white shadow-sm"
                : "bg-stone-200 ring-1 ring-inset ring-stone-300"
            } ${d.isToday ? "ring-2 ring-stone-500" : ""}`}
          >
            {d.completed && (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
