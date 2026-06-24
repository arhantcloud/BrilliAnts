import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Don't let a real Firebase config leak into the test environment; tests
    // exercise the offline (localStorage) fallback paths.
    env: {
      VITE_FIREBASE_API_KEY: "",
      VITE_FIREBASE_PROJECT_ID: "",
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
