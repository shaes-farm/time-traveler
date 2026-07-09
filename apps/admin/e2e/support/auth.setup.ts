import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE } from "./env";
import { seedTestUser, TEST_USER } from "./test-user";

/**
 * The `setup` project: seed the test account, sign in through the real
 * login form once, and persist the resulting session so the authenticated
 * project can reuse it without re-authenticating per test.
 *
 * Signing in via the UI (rather than injecting cookies) exercises the
 * production auth path — the sign-in Server Action, the `@supabase/ssr`
 * cookie handshake, and the redirect to the dashboard.
 */
setup("authenticate", async ({ page }) => {
  await seedTestUser();

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
