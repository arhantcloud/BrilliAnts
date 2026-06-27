import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

type TypeId = "permutations" | "sequences" | "combinations" | "multisets";

type TypeInfo = {
  id: TypeId;
  name: string;
  order: string;
  replacement: string;
  emoji: string;
  example: string;
};

const TYPES: Record<TypeId, TypeInfo> = {
  permutations: {
    id: "permutations",
    name: "Permutations",
    order: "order matters",
    replacement: "no repeats",
    emoji: "🥇",
    example: "Race podium: who finishes 1st, 2nd, 3rd.",
  },
  sequences: {
    id: "sequences",
    name: "Sequences",
    order: "order matters",
    replacement: "repeats allowed",
    emoji: "🔢",
    example: "4-digit PIN: digits can repeat and order counts.",
  },
  combinations: {
    id: "combinations",
    name: "Combinations",
    order: "order doesn't matter",
    replacement: "no repeats",
    emoji: "👥",
    example: "Study team: pick 3 friends from a group.",
  },
  multisets: {
    id: "multisets",
    name: "Multisets",
    order: "order doesn't matter",
    replacement: "repeats allowed",
    emoji: "🍕",
    example: "Pizza: 8 toppings chosen from 4, repeats ok.",
  },
};

// 2x2 layout (row-major), matching the map from earlier slides.
const GRID: TypeId[] = [
  "permutations",
  "sequences",
  "combinations",
  "multisets",
];

export default function ReviewMap({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<TypeId | null>(null);

  // Review slide: no gate; allow advancing right away.
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Review: the four kinds"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Two questions decide everything: does <b>order matter</b>, and can items{" "}
        <b>repeat</b>? Tap each type to review what you learned.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {GRID.map((id, i) => {
          const t = TYPES[id];
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`flex animate-fade-in-up flex-col items-center justify-center rounded-2xl border-2 px-2 py-4 text-center transition active:scale-[0.98] ${
                active
                  ? "border-brand-500 bg-brand-50"
                  : "border-stone-200 bg-white hover:border-brand-300"
              }`}
            >
              <span className="text-2xl leading-none">{t.emoji}</span>
              <span className="mt-1.5 text-[13px] font-bold text-stone-800">
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      <DetailPanel type={selected ? TYPES[selected] : null} />
    </div>
  );
}

function DetailPanel({ type }: { type: TypeInfo | null }) {
  return (
    <div className="mt-4 min-h-[120px] rounded-2xl bg-stone-900 p-5 text-white">
      {!type ? (
        <div className="flex h-[80px] items-center justify-center text-center text-sm text-stone-400">
          Tap a type above to review it.
        </div>
      ) : (
        <div key={type.id} className="animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{type.emoji}</span>
            <p className="text-base font-bold">{type.name}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag>{type.order}</Tag>
            <Tag>{type.replacement}</Tag>
          </div>
          <p className="mt-3 text-[13px] text-stone-300">
            <span className="font-semibold text-brand-200">Example: </span>
            {type.example}
          </p>
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-brand-100">
      {children}
    </span>
  );
}
