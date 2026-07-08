/*
 * `process.env.CI` here is the standard CI marker, not a Turborepo task
 * input — this config runs Playwright directly, outside the turbo task
 * graph — so the turbo env-var declaration rule doesn't apply.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, STORAGE_STATE } from "./e2e/support/env";

/**
 * Load `apps/admin/.env.local` into `process.env` so the setup project can
 * reach Supabase (URL + service-role key) and sign in the test user. In CI
 * these come from the real environment (sourced from `supabase status`),
 * so a missing file is not fatal.
 */
const localEnv = new URL("./.env.local", import.meta.url);
if (existsSync(localEnv)) {
  process.loadEnvFile(localEnv);
}

/**
 * Playwright end-to-end config for the admin app.
 *
 * Specs live in `./e2e` and run against a dev server Playwright boots
 * itself (`pnpm run dev`). These tests are intentionally kept out of the
 * Turborepo `test` task (Vitest + the pre-push coverage gate) — e2e needs
 * a live server and a browser, so it runs on demand via `pnpm run test:e2e`.
 *
 * Projects:
 *   - `chromium`       — anonymous specs. No session, no Supabase required.
 *   - `setup`          — seeds the test user and saves an authenticated
 *                        storage state (see e2e/support/auth.setup.ts).
 *   - `authenticated`  — specs that start signed in; depends on `setup`.
 *
 * Run everything with `pnpm test:e2e`, or a single project with
 * `pnpm test:e2e --project=chromium` (the anon suite, no DB needed).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Anonymous suite only — skip the setup file and authenticated specs.
      testIgnore: [/\/support\//, /\/authenticated\//],
    },
    {
      name: "setup",
      testMatch: /support\/auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /\/authenticated\/.*\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
  ],

  // Boot the admin dev server before running, and reuse an already-running
  // one locally so `pnpm dev` in another terminal isn't clobbered.
  webServer: {
    command: "pnpm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
