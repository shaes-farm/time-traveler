import { expect, test } from "@playwright/test";
import { sweepCrudLeftovers } from "../support/cleanup";
import {
  deleteViaDangerZone,
  expectDetailAndReadSlug,
  saveForm,
} from "../support/crud-helpers";

/**
 * Story CRUD spine — drives create → view → edit → delete through the UI
 * (no seeding). Self-cleaning: the story it creates is removed in the final
 * step. Stories have no required temporal span, so a title is all that's
 * needed to create.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("story CRUD spine", () => {
  // Safety net for the run that doesn't reach its delete step (#355).
  const stamps: number[] = [];
  test.afterAll(async () => {
    await sweepCrudLeftovers(
      "stories",
      stamps.map((s) => `e2e-crud-story-${s}%`),
    );
  });

  test("create, view, edit, then delete a story", async ({ page }) => {
    const stamp = Date.now();
    stamps.push(stamp);
    const title = `E2E CRUD Story ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    await page.goto("/stories/new");
    await page.getByPlaceholder("The story's title").fill(title);
    await saveForm(page);

    // ── View ────────────────────────────────────────────────────────────
    const slug = await expectDetailAndReadSlug(page, title);

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/stories/${slug}/edit`);
    const titleField = page.getByPlaceholder("The story's title");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await saveForm(page);

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/stories/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await deleteViaDangerZone(page, "story");
    await page.waitForURL("**/stories");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
