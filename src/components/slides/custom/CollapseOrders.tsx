import { useState } from "react";
import type { CustomSlideProps } from "./registry";

type Person = { id: string; color: string };

const PEOPLE: Person[] = [
  { id: "A", color: "bg-rose-400" },
  { id: "B", color: "bg-sky-400" },
  { id: "C", color: "bg-amber-400" },
  { id: "D", color: "bg-violet-400" },
];

function person(id: string) {
  return PEOPLE.find((p) => p.id === id)!;
}

// The 6 unordered teams (each is one combination of 2 of 4).
const TEAMS: [string, string][] = [];
for (let i = 0; i < PEOPLE.length; i++)
  for (let j = i + 1; j < PEOPLE.length; j++)
    TEAMS.push([PEOPLE[i].id, PEOPLE[j].id]);

const ORDERED = PEOPLE.length * (PEOPLE.length - 1); // 12

export default function CollapseOrders({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [perTeam, setPerTeam] = useState("");
  const [teams, setTeams] = useState("");
  const [solved, setSolved] = useState(false);

  const perTeamCorrect = perTeam.trim() !== "" && Number(perTeam) === 2;
  const teamsCorrect = teams.trim() !== "" && Number(teams) === TEAMS.length;

  function maybeSolve(a: boolean, b: boolean) {
    if (collapsed && a && b && !solved) {
      setSolved(true);
      onComplete();
    }
  }

  function onPerTeam(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setPerTeam(d);
    maybeSolve(d !== "" && Number(d) === 2, teamsCorrect);
  }
  function onTeams(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setTeams(d);
    maybeSolve(perTeamCorrect, d !== "" && Number(d) === TEAMS.length);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "When order stops mattering"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Pick 2 of 4 people for a team. Ordered, there are 4 × 3 = {ORDERED}{" "}
        picks — but <b>A→B</b> is the same team as <b>B→A</b>. Collapse the
        duplicates and count the real teams.
      </p>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => !solved && setCollapsed((c) => !c)}
          disabled={solved}
          className={`rounded-full px-5 py-2 text-sm font-bold transition active:scale-95 ${
            collapsed
              ? "bg-slate-100 text-slate-500"
              : "bg-brand-500 text-white shadow-sm"
          }`}
        >
          {collapsed ? "Expand orderings" : "Collapse duplicates"}
        </button>
      </div>

      {/* Grid of teams: each shows its two orderings, then merges into a set */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TEAMS.map(([a, b], i) => (
          <div
            key={i}
            className="flex min-h-[68px] items-center justify-center rounded-xl border-2 border-slate-100 bg-white p-2"
          >
            {collapsed ? (
              <div className="flex animate-pop-in items-center gap-1">
                <span className="text-lg font-bold text-slate-300">{"{"}</span>
                <Dot id={a} />
                <Dot id={b} />
                <span className="text-lg font-bold text-slate-300">{"}"}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Order a={a} b={b} />
                <Order a={b} b={a} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Readout */}
      <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
        {!collapsed ? (
          <p className="text-sm text-slate-400">
            Tap “Collapse duplicates” — watch each pair of orderings merge into
            one team.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-center gap-2 text-2xl font-extrabold">
              <span>{ORDERED} ÷</span>
              <Field
                label="orderings/team"
                value={perTeam}
                onChange={onPerTeam}
                correct={perTeamCorrect}
                solved={solved}
                width="w-14"
              />
              <span>=</span>
              <Field
                label="teams"
                value={teams}
                onChange={onTeams}
                correct={teamsCorrect}
                solved={solved}
                width="w-16"
              />
            </div>
            <p className="mt-2 text-[13px] text-slate-300">
              {solved
                ? `Each team was counted twice (A→B and B→A), so ${ORDERED} ÷ 2 = ${TEAMS.length} teams.`
                : "How many orderings did each team collapse from? Divide them out."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Order({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex items-center gap-1">
      <Dot id={a} />
      <span className="text-xs text-slate-300">→</span>
      <Dot id={b} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  correct,
  solved,
  width,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  solved: boolean;
  width: string;
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        disabled={solved}
        className={`${width} rounded-lg px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
          correct
            ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
            : value.trim() !== ""
              ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
              : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
        }`}
      />
    </span>
  );
}

function Dot({ id }: { id: string }) {
  const p = person(id);
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${p.color}`}
    >
      {p.id}
    </span>
  );
}
