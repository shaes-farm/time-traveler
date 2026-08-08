import { expect, test as setup } from "@playwright/test";
import { sweepE2eAuthUsers, sweepE2eContent } from "./cleanup";
import { STORAGE_STATE } from "./env";
import { seedTestUser, TEST_USER } from "./test-user";

/** Entry sweep age floor for throwaway accounts — see {@link sweepE2eAuthUsers}. */
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * The `setup` project: seed the test account, reclaim any rows a previous run
 * stranded, sign in through the real login form once, and persist the
 * resulting session so the authenticated project can reuse it without
 * re-authenticating per test.
 *
 * Signing in via the UI (rather than injecting cookies) exercises the
 * production auth path — the sign-in Server Action, the `@supabase/ssr`
 * cookie handshake, and the redirect to the dashboard.
 */
setup("authenticate", async ({ page }) => {
  const userId = await seedTestUser();

  // Reclaim the previous run's wreckage before seeding anything new. The
  // `cleanup` teardown project handles the tidy exit; this handles the run
  // that was killed before it got there (#355). Race-free for content: only
  // the `authenticated` project creates content rows, and it is gated behind
  // this project via `dependencies`.
  await sweepE2eContent(userId);
  await sweepE2eAuthUsers(ONE_HOUR_MS);

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // The sign-in Server Action redirects to the dashboard on success.
  await page.waitForURL("**/dashboard");
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
