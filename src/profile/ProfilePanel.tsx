import { useAuth } from "../auth/auth-context";
import { useProgress } from "../progress/progress-context";
import { useProfile } from "./profile-context";
import Avatar from "./Avatar";
import WeekStreak from "./WeekStreak";

/** Warm, on-palette ant body colours. */
const ANT_COLORS = [
  "#a44a26", // brand-600
  "#c05f33", // brand-500
  "#b23b3b", // warrior red
  "#c2912f", // gold
  "#4e342b", // umber-700
  "#2f8f83", // teal
  "#4f5bbf", // indigo
  "#1f1a17", // near-black
];

/** Soft avatar backgrounds. */
const BG_COLORS = [
  "#f9e3d4", // brand-100
  "#e6ddd5", // umber-100
  "#dcecc8", // light green
  "#cfe3f5", // light blue
  "#f6d6e0", // pink
  "#efe2b6", // sand
  "#ffffff", // white
  "#2b2622", // dark
];

function Swatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-8 rounded-full transition ${
        selected
          ? "ring-2 ring-offset-2 ring-stone-700"
          : "ring-1 ring-black/10 hover:scale-105"
      }`}
      style={{ background: color }}
      aria-label={`Choose ${color}`}
      aria-pressed={selected}
    />
  );
}

/**
 * The profile panel: edit username + avatar colours (live preview), view the
 * weekly streak, and log out.
 */
export default function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { profile, update } = useProfile();
  const { logOut } = useAuth();
  const { stats } = useProgress();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 text-stone-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold">Your profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 text-stone-400 hover:text-stone-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Live avatar preview */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <Avatar
            antColor={profile.antColor}
            bgColor={profile.bgColor}
            size={88}
            ring={false}
          />
          <p className="text-sm font-bold text-stone-700">
            {profile.username || "Ant keeper"}
          </p>
        </div>

        {/* Username */}
        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Username
          </span>
          <input
            type="text"
            value={profile.username}
            maxLength={24}
            onChange={(e) => update({ username: e.target.value })}
            placeholder="Ant keeper"
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        {/* Ant colour */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Ant colour
          </p>
          <div className="flex flex-wrap gap-2">
            {ANT_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={profile.antColor === c}
                onClick={() => update({ antColor: c })}
              />
            ))}
          </div>
        </div>

        {/* Background colour */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Background
          </p>
          <div className="flex flex-wrap gap-2">
            {BG_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                selected={profile.bgColor === c}
                onClick={() => update({ bgColor: c })}
              />
            ))}
          </div>
        </div>

        {/* Weekly streak */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            This week
          </p>
          <WeekStreak
            currentStreak={stats.currentStreak}
            lastActiveDate={stats.lastActiveDate}
          />
        </div>

        <button
          type="button"
          onClick={() => logOut()}
          className="w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
