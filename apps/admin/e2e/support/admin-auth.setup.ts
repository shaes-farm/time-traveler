import { expect, test as setup } from "@playwright/test";
import { sweepE2eVocabulary } from "./cleanup";
import { ADMIN_STORAGE_STATE } from "./env";
import { ADMIN_TEST_USER, seedAdminTestUser } from "./test-user";

/**
 * The `admin-setup` project: seed the admin account, reclaim any vocabulary
 * rows a previous run stranded, sign in through the real login form, and
 * persist the session for `admin-authenticated`.
 *
 * Signing in via the UI rather than injecting cookies is deliberate here for a
 * second reason beyond exercising the auth path: the role gate in `proxy.ts`
 * reads `profiles.role` on every `/admin` request, so a session minted this way
 * is the only one that proves the gate lets a real admin through.
 *
 * The vocabulary sweep runs here rather than only at teardown because a killed
 * run (`Ctrl-C`, a crash) never reaches the teardown project, and stranded
 * `e2e_` rows break the `00030` pgTAP row-count assertions on the next
 * `pnpm db:test` — a failure that looks nothing like its cause.
 */
setup("authenticate as admin", async ({ page }) => {
  await seedAdminTestUser();
  await sweepE2eVocabulary();

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(ADMIN_TEST_USER.email);
  await page.getByLabel("Password").fill(ADMIN_TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/dashboard");
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();

  // The admin-only nav group is the cheapest end-to-end proof that the role
  // landed on the profile; if the promotion silently failed, every spec in the
  // admin project would otherwise fail later with a confusing redirect.
  await expect(
    page.getByRole("link", { name: "Relationship vocabulary" }),
  ).toBeVisible();

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
