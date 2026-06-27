/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf5ef",
          100: "#f9e3d4",
          200: "#f0c4a8",
          300: "#e3a079",
          400: "#d27c4f",
          500: "#c05f33",
          600: "#a44a26",
          700: "#863a20",
          800: "#6c311f",
          900: "#57291c",
        },
        // Espresso / walnut earthy accent. Replaces the old cool violet/purple
        // slot so multi-category slides keep a distinct hue that still reads
        // "ant colony"; the named accent (#4e342b) sits at umber-700.
        umber: {
          50: "#f3efec",
          100: "#e6ddd5",
          200: "#cdbcb0",
          300: "#ad9588",
          400: "#8a6e5f",
          500: "#6b5044",
          600: "#574036",
          700: "#4e342b",
          800: "#3f2a22",
          900: "#33221c",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Slot-machine: settle on a digit, spin, settle again. Seamless loop
        // (strip repeats every 50%, plateaus land on digit boundaries).
        reel: {
          "0%, 20%": { transform: "translateY(0)" },
          "40%, 60%": { transform: "translateY(-25%)" },
          "80%, 100%": { transform: "translateY(-50%)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16%)" },
        },
        // Subtle podium rise.
        grow: {
          "0%, 100%": { transform: "scaleY(0.95)" },
          "50%": { transform: "scaleY(1)" },
        },
        blink: {
          "0%, 35%": { opacity: "0", transform: "scale(0.4)" },
          "50%, 100%": { opacity: "1", transform: "scale(1)" },
        },
        // Podium runners swap: slide out right, new color slides in from left.
        // Two swaps per cycle so it loops back to the original color seamlessly.
        swap1: {
          "0%, 22%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#c05f33" },
          "30%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#c05f33" },
          "31%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#fb7185" },
          "39%, 72%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#fb7185" },
          "80%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#fb7185" },
          "81%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#c05f33" },
          "89%, 100%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#c05f33" },
        },
        swap2: {
          "0%, 22%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#fbbf24" },
          "30%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#fbbf24" },
          "31%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#b5874b" },
          "39%, 72%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#b5874b" },
          "80%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#b5874b" },
          "81%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#fbbf24" },
          "89%, 100%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#fbbf24" },
        },
        swap3: {
          "0%, 22%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#34d399" },
          "30%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#34d399" },
          "31%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#fb923c" },
          "39%, 72%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#fb923c" },
          "80%": { transform: "translateX(260%)", opacity: "0", backgroundColor: "#fb923c" },
          "81%": { transform: "translateX(-260%)", opacity: "0", backgroundColor: "#34d399" },
          "89%, 100%": { transform: "translateX(0)", opacity: "1", backgroundColor: "#34d399" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "pop-in": "pop-in 0.3s ease-out both",
        reel: "reel 3.2s ease-in-out infinite",
        bob: "bob 1.8s ease-in-out infinite",
        grow: "grow 2.2s ease-in-out infinite",
        blink: "blink 2.4s ease-in-out infinite",
        swap1: "swap1 5s ease-in-out infinite",
        swap2: "swap2 5s ease-in-out infinite",
        swap3: "swap3 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
