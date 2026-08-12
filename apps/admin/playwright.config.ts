/*
 * `process.env.CI` here is the standard CI marker, not a Turborepo task
 * input — this config runs Playwright directly, outside the turbo task
 * graph — so the turbo env-var declaration rule doesn't apply.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import {
  ADMIN_STORAGE_STATE,
  BASE_URL,
  STORAGE_STATE,
} from "./e2e/support/env";

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
 *   - `chromium`       — anonymous specs. No session; decoupled from the
 *                        `setup`/seed step (no seeded user needed). The app
 *                        and its Supabase config still run — the proxy calls
 *                        `getUser()` on every request.
 *   - `setup`          — seeds the editor test user and saves an authenticated
 *                        storage state (see e2e/support/auth.setup.ts).
 *   - `authenticated`  — specs that start signed in as an editor; depends on
 *                        `setup`.
 *   - `admin-setup`    — seeds the admin-role account and saves its own storage
 *                        state (see e2e/support/admin-auth.setup.ts).
 *   - `admin-authenticated` — specs for admin-only surfaces; depends on
 *                        `admin-setup`.
 *
 * The two signed-in projects deliberately use different accounts: the editor
 * session is what proves the `/admin` role gate turns a non-admin away, so it
 * must stay non-admin.
 *
 * Run everything with `pnpm test:e2e`, or a single project with
 * `pnpm test:e2e --project=chromium` (the anon suite — skips the seed step).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Specs run against the Next dev server (`pnpm run dev`), which compiles
  // routes on demand — under peak parallel load a mutation can transiently fail
  // (e.g. a CRUD spine's save). One local retry absorbs that single-shot dev-
  // server flake, matching the intent of the CI retry policy; `trace:
  // "on-first-retry"` still captures a trace when the first attempt fails.
  retries: process.env.CI ? 2 : 1,
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
      // Anonymous suite only — skip the setup files and every signed-in spec.
      testIgnore: [
        /\/support\//,
        /\/authenticated\//,
        /\/admin-authenticated\//,
      ],
      // These specs create throwaway auth accounts, and this project does not
      // depend on `setup` (see above), so it needs its own reference to the
      // teardown to be covered by it.
      teardown: "cleanup",
    },
    {
      name: "setup",
      testMatch: /support\/auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      teardown: "cleanup",
    },
    {
      // Sweeps e2e rows and throwaway accounts once every project that
      // references it has finished (#355). Skipped under `--no-deps`; the
      // entry sweep in auth.setup.ts is the backstop for that and for a
      // killed run.
      name: "cleanup",
      testMatch: /support\/cleanup\.teardown\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /\/authenticated\/.*\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
    {
      // Seeds the admin-role account. Separate from `setup` because the two
      // sessions must not be the same account: `authenticated` runs as an
      // editor precisely so it can prove the admin gate turns it away.
      name: "admin-setup",
      testMatch: /support\/admin-auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      teardown: "cleanup",
    },
    {
      name: "admin-authenticated",
      testMatch: /\/admin-authenticated\/.*\.spec\.ts$/,
      dependencies: ["admin-setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STORAGE_STATE },
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
