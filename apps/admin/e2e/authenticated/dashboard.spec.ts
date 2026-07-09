import { expect, test } from "@playwright/test";
import { TEST_USER } from "../support/test-user";

/**
 * Authenticated dashboard coverage. These specs run under the
 * `authenticated` project, which loads the storage state saved by the
 * `setup` project — so the page starts already signed in.
 */

test.describe("authenticated dashboard", () => {
  test("loads the protected shell for a signed-in user", async ({ page }) => {
    await page.goto("/dashboard");

    // No bounce to /auth/login — the seeded session is honoured.
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();

    // The server-loaded profile surfaces the seeded user's name in the shell.
    await expect(
      page.getByText(`${TEST_USER.firstName} ${TEST_USER.lastName}`),
    ).toBeVisible();
  });

  test("primary navigation exposes the content sections", async ({ page }) => {
    await page.goto("/dashboard");

    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    for (const label of ["Dashboard", "Characters", "Timelines", "Events"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });
});
