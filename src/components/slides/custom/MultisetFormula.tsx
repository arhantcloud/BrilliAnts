import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 5, slide 4: build the multiset count from the wafer/scoop pieces.
 * Step 1: name the pieces in variables (scoops = k, wafers = n − 1). Step 2:
 * drop them into the combination C(wafers + scoops, wafers) = C(k + n − 1,
 * n − 1), whose two arguments are labelled "wafers + scoops" and "wafers".
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[()\s]/g, "")
    .replace(/[−–]/g, "-");

const ACCEPT = {
  scoops: ["k"],
  wafers: ["n-1"],
  // wafers + scoops = (n − 1) + k, written any order.
  top: ["k+n-1", "n-1+k", "n+k-1"],
  bottom: ["n-1"],
};

export default function MultisetFormula({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [scoops, setScoops] = useState("");
  const [wafers, setWafers] = useState("");
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [solved, setSolved] = useState(false);

  const scoopsOk = ACCEPT.scoops.includes(norm(scoops));
  const wafersOk = ACCEPT.wafers.includes(norm(wafers));
  const piecesDone = scoopsOk && wafersOk;

  const topOk = ACCEPT.top.includes(norm(top));
  const bottomOk = ACCEPT.bottom.includes(norm(bottom));

  function tryComplete(t: string, b: string) {
    if (
      !solved &&
      piecesDone &&
      ACCEPT.top.includes(norm(t)) &&
      ACCEPT.bottom.includes(norm(b))
    ) {
      setSolved(true);
      onComplete();
    }
  }
  function onTop(v: string) {
    if (solved) return;
    setTop(v);
    tryComplete(v, bottom);
  }
  function onBottom(v: string) {
    if (solved) return;
    setBottom(v);
    tryComplete(top, v);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "The multiset formula"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Now in variables: there are <b>n flavors</b> and you pick <b>k scoops</b>.
        The wafers are the dividers <i>between</i> the flavors. Name each piece,
        then build the count.
      </p>

      {/* Step 1: name the pieces in variables */}
      <div className="card mt-4 p-4">
        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-stone-400">
          In terms of n and k
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-lg font-extrabold text-stone-700">
          <span className="flex items-center gap-2">
            scoops =
            <VarField
              aria="scoops in variables"
              value={scoops}
              onChange={(v) => !piecesDone && setScoops(v)}
              correct={scoopsOk}
              disabled={piecesDone}
              width="w-20"
            />
          </span>
          <span className="flex items-center gap-2">
            wafers =
            <VarField
              aria="wafers in variables"
              value={wafers}
              onChange={(v) => !piecesDone && setWafers(v)}
              correct={wafersOk}
              disabled={piecesDone}
              width="w-24"
            />
          </span>
        </div>
      </div>

      {/* Step 2: fill in the combination */}
      {piecesDone && (
        <div className="mt-3 animate-fade-in-up rounded-2xl bg-stone-900 p-4 text-white">
          <p className="text-center text-[13px] font-semibold text-stone-200">
            Fill in the combination
          </p>
          <div className="mt-4 flex flex-wrap items-start justify-center gap-2 text-2xl font-extrabold">
            <span className="pt-2">C(</span>
            <VarField
              aria="combination first part"
              label="wafers + scoops"
              value={top}
              onChange={onTop}
              correct={topOk}
              disabled={solved}
              width="w-28"
              dark
            />
            <span className="pt-2">,</span>
            <VarField
              aria="combination second part"
              label="wafers"
              value={bottom}
              onChange={onBottom}
              correct={bottomOk}
              disabled={solved}
              width="w-20"
              dark
            />
            <span className="pt-2">)</span>
          </div>

          {solved && (
            <p className="mt-4 animate-fade-in rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-[13px] font-semibold text-emerald-300">
              C(wafers + scoops, wafers) = C(k + n − 1, n − 1), the number of
              multisets.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function VarField({
  aria,
  label,
  value,
  onChange,
  correct,
  disabled,
  width = "w-24",
  dark = false,
}: {
  aria: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  disabled: boolean;
  width?: string;
  dark?: boolean;
}) {
  const filled = value.trim() !== "";
  const tone = dark
    ? correct
      ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
      : filled
        ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
        : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
    : correct
      ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400"
      : filled
        ? "bg-red-50 text-red-600 ring-2 ring-red-300"
        : "bg-white text-stone-800 ring-2 ring-stone-200 focus:ring-brand-400";

  return (
    <span className="flex flex-col items-center gap-1">
      <input
        type="text"
        inputMode="text"
        aria-label={aria}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        disabled={disabled}
        maxLength={7}
        className={`${width} rounded-lg px-2 py-1 text-center text-xl font-extrabold outline-none transition ${tone}`}
      />
      {label && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${
            dark ? "text-stone-400" : "text-stone-400"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
