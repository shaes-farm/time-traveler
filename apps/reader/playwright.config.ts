/*
 * `process.env.CI` here is the standard CI marker, not a Turborepo task
 * input — this config runs Playwright directly, outside the turbo task
 * graph — so the turbo env-var declaration rule doesn't apply.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./e2e/support/env";

/**
 * Playwright end-to-end config for the public reader app.
 *
 * Specs live in `./e2e` and run against a dev server Playwright boots itself
 * (`pnpm run dev`). Like the admin suite, these are kept out of the Turborepo
 * `test` task (Vitest + the pre-push coverage gate) and off the CI gate — e2e
 * needs a live server and a browser, so it runs on demand via
 * `pnpm --filter reader test:e2e` ([ADR-0036]).
 *
 * Intentionally much simpler than `apps/admin/playwright.config.ts`. The reader
 * is anonymous and read-only ([ADR-0030]), so there is:
 *   - no `setup` project, no `storageState`, no seeded test user;
 *   - no `process.loadEnvFile` (admin needs the service-role key in the
 *     Playwright process to seed; nothing here does — Next loads `.env.local`
 *     into the dev server on its own);
 *   - no dependency on a running local Supabase. Every route today is static
 *     or a placeholder and issues zero queries. `apps/reader/.env.local` must
 *     still exist, because the realtime provider lazily imports the anon client
 *     post-mount and `@repo/services/supabase/client` throws at module scope
 *     when the public env vars are absent.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Specs run against the Next dev server (`pnpm run dev`), which compiles
  // routes on demand — under peak parallel load a first navigation can
  // transiently time out. One local retry absorbs that single-shot dev-server
  // flake, matching the intent of the CI retry policy; `trace: "on-first-retry"`
  // still captures a trace when the first attempt fails.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  // Chromium only, matching the admin suite. The reader is a public surface
  // where cross-browser coverage will eventually matter — adding WebKit is a
  // few lines here once there are real screens (rather than placeholders) to
  // justify the extra browser binary and run time.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // `support/` holds shared constants, not specs.
      testIgnore: [/\/support\//],
    },
  ],

  // Boot the reader dev server before running, and reuse an already-running
  // one locally so `pnpm dev:reader` in another terminal isn't clobbered.
  webServer: {
    command: "pnpm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
