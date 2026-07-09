import { expect, test } from "@playwright/test";
import {
  deleteViaDangerZone,
  expectDetailAndReadSlug,
  saveForm,
  setStartDate,
} from "../support/crud-helpers";

/**
 * Period CRUD spine — drives create → view → edit → delete through the UI
 * (no seeding). Self-cleaning: the period it creates is removed in the final
 * step. Like timelines, the Start span is required. The delete dialog titles
 * with the record (`Delete "<title>"?`) rather than the entity noun.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("period CRUD spine", () => {
  test("create, view, edit, then delete a period", async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E CRUD Period ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    await page.goto("/periods/new");
    await page.getByPlaceholder("e.g. Jurassic").fill(title);
    await setStartDate(page, 2000);
    await saveForm(page);

    // ── View ────────────────────────────────────────────────────────────
    const slug = await expectDetailAndReadSlug(page, title);

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/periods/${slug}/edit`);
    const titleField = page.getByPlaceholder("e.g. Jurassic");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await saveForm(page);

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/periods/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    // The confirmation dialog titles with the record: Delete "<title>"?
    await deleteViaDangerZone(page, "period", { dialogName: /^Delete .+\?$/ });
    await page.waitForURL("**/periods");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
