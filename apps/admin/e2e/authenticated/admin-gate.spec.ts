import { expect, test } from "@playwright/test";

/**
 * The admin role gate, from the editor's side (#428).
 *
 * This project's session is the seeded **editor** account, so these assertions
 * are the negative half of the gate: an authenticated non-admin must be turned
 * away, not merely shown an empty page.
 *
 * The positive half — an admin actually reaching the surface — is asserted in
 * `admin-authenticated/relationship-vocabulary-crud.spec.ts`.
 */
test.describe("admin route gate", () => {
  test("redirects an editor away from an admin route", async ({ page }) => {
    await page.goto("/admin/relationship-vocabulary");

    // `proxy.ts` matches the `/admin` URL prefix, reads `profiles.role`, and
    // bounces. A blank 200 here would mean the gate silently did nothing —
    // which is exactly what happens if an admin page is ever placed behind a
    // bare `(admin)` route group, whose path carries no `/admin` segment.
    await page.waitForURL("**/dashboard?error=forbidden");
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
  });

  test("redirects an editor from the admin root as well", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/dashboard?error=forbidden");
  });

  test("does not advertise admin surfaces in the sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();
    await expect(nav.getByText("Administration")).toBeHidden();
    await expect(
      nav.getByRole("link", { name: "Relationship vocabulary" }),
    ).toBeHidden();
  });
});
