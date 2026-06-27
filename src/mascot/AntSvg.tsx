/** Expression of the ant; kept for API compatibility (subtle in top-down view). */
export type AntMood = "happy" | "encouraging" | "celebrate";

/**
 * Andi the ant, a TOP-DOWN view, as if crawling on the page, pointing "up"
 * (north) by default; the overlay rotates the whole SVG to face the direction of
 * travel. Legs are split into two alternating tripod groups (`ant-legs-a` /
 * `ant-legs-b`) that swing via CSS for a walking gait. Tinted with the app's
 * `brand` palette.
 */
export default function AntSvg({
  mood = "encouraging",
  walking = true,
  className,
}: {
  mood?: AntMood;
  /** When false the legs hold still (only the head/antennae keep moving). */
  walking?: boolean;
  className?: string;
}) {
  const body = "#a44a26"; // brand-600
  const bodyDark = "#57291c"; // brand-900
  const limb = "#3a2017";
  const accent = mood === "celebrate" ? "#fbbf24" : "#e3a079"; // brand-300

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Andi the ant mascot"
    >
      {/* Antennae (sway) */}
      <g
        className="ant-antennae"
        stroke={limb}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M29 13 Q25 6 22 4" />
        <path d="M35 13 Q39 6 42 4" />
      </g>
      <circle cx="22" cy="4" r="1.8" fill={accent} />
      <circle cx="42" cy="4" r="1.8" fill={accent} />

      {/* Legs, group A: front-left, mid-right, back-left */}
      <g
        className={`ant-legs ${walking ? "ant-legs-a" : ""}`}
        stroke={limb}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M27 25 L19 21 L12 23" />
        <path d="M37 31 L47 34 L53 39" />
        <path d="M27 38 L18 43 L13 50" />
      </g>

      {/* Legs, group B: front-right, mid-left, back-right */}
      <g
        className={`ant-legs ${walking ? "ant-legs-b" : ""}`}
        stroke={limb}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M37 25 L45 21 L52 23" />
        <path d="M27 31 L17 34 L11 39" />
        <path d="M37 38 L46 43 L51 50" />
      </g>

      {/* Body: abdomen (rear), thorax (mid), head (front/top) */}
      <ellipse cx="32" cy="45" rx="9" ry="13" fill={body} />
      <ellipse cx="32" cy="30" rx="6" ry="7" fill={bodyDark} />
      <circle cx="32" cy="17" r="6.5" fill={body} />

      {/* Mandibles */}
      <g stroke={limb} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M30 12 L28 8" />
        <path d="M34 12 L36 8" />
      </g>

      {/* Eyes (top-down, on the sides of the head) */}
      <circle cx="28.5" cy="16" r="1.6" fill="#2a160d" />
      <circle cx="35.5" cy="16" r="1.6" fill="#2a160d" />

      {/* Subtle sheen on the abdomen */}
      <ellipse cx="29" cy="40" rx="2.4" ry="4" fill="#c05f33" opacity="0.5" />
    </svg>
  );
}
