import AntSvg from "../mascot/AntSvg";

/** Darken a hex colour toward black by `amt` (0..1), for the ant's thorax. */
export function darken(hex: string, amt = 0.4): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.round(((n >> 16) & 255) * (1 - amt));
  const g = Math.round(((n >> 8) & 255) * (1 - amt));
  const b = Math.round((n & 255) * (1 - amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** The learner's icon: an ant in `antColor` on a `bgColor` disc. */
export default function Avatar({
  antColor,
  bgColor,
  size = 40,
  ring = true,
}: {
  antColor: string;
  bgColor: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: bgColor,
        boxShadow: ring ? "0 0 0 2px rgba(255,255,255,0.65)" : undefined,
      }}
      aria-hidden
    >
      <AntSvg
        walking={false}
        bodyColor={antColor}
        bodyDarkColor={darken(antColor)}
        className="h-[78%] w-[78%]"
      />
    </span>
  );
}
