import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Optional secrets for the admin journey (gitignored): E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD.
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

/**
 * Browser journeys. By default they run against a production build on
 * http://localhost:3001 (started automatically, or reused if already running).
 * Set E2E_BASE_URL to test another deployment instead, e.g. a Vercel preview.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "tests/e2e",
  // The journeys share one Supabase project; keep them sequential and predictable.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- -p 3001",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 300_000,
      },
});
