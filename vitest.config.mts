import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/** Unit tests: fast, no browser, no network. Browser journeys live in tests/e2e (Playwright). */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
