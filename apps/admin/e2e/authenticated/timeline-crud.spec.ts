import { expect, test } from "@playwright/test";
import {
  deleteViaDangerZone,
  expectDetailAndReadSlug,
  saveForm,
  setStartDate,
} from "../support/crud-helpers";

/**
 * Timeline CRUD spine — drives the full create → view → edit → delete
 * journey through the UI (no seeding). Self-cleaning: the timeline it
 * creates is removed in the final step. The form-driving mechanics live in
 * ../support/crud-helpers.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("timeline CRUD spine", () => {
  test("create, view, edit, then delete a timeline", async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E CRUD Timeline ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    await page.goto("/timelines/new");
    await page.getByPlaceholder("Timeline title").fill(title);
    await setStartDate(page, 2000);
    await saveForm(page);

    // ── View ────────────────────────────────────────────────────────────
    const slug = await expectDetailAndReadSlug(page, title);

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/timelines/${slug}/edit`);
    const titleField = page.getByPlaceholder("Timeline title");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await saveForm(page);

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/timelines/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await deleteViaDangerZone(page, "timeline");
    await page.waitForURL("**/timelines");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
