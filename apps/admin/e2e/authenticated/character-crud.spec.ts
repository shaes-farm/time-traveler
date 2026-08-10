import { expect, test } from "@playwright/test";
import { sweepCrudLeftovers } from "../support/cleanup";
import {
  deleteViaDangerZone,
  expectDetailAndReadSlug,
  saveForm,
} from "../support/crud-helpers";

/**
 * Character CRUD spine — drives create → view → edit → delete through the UI
 * (no seeding). Self-cleaning: the character it creates is removed in the
 * final step. Simpler than the timeline/event spines — character_type
 * defaults and the temporal (birth/death) spans are optional, so a name is
 * all that's required to create.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("character CRUD spine", () => {
  // Safety net for the run that doesn't reach its delete step (#355).
  const stamps: number[] = [];
  test.afterAll(async () => {
    await sweepCrudLeftovers(
      "characters",
      stamps.map((s) => `e2e-crud-character-${s}%`),
    );
  });

  test("create, view, edit, then delete a character", async ({ page }) => {
    const stamp = Date.now();
    stamps.push(stamp);
    const name = `E2E CRUD Character ${stamp}`;
    const editedName = `${name} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    await page.goto("/characters/new");
    await page.getByPlaceholder("Character name").fill(name);
    await saveForm(page);

    // ── View ────────────────────────────────────────────────────────────
    const slug = await expectDetailAndReadSlug(page, name);

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/characters/${slug}/edit`);
    const nameField = page.getByPlaceholder("Character name");
    await expect(nameField).toHaveValue(name);
    await nameField.fill(editedName);
    await saveForm(page);

    await expect(
      page.getByRole("heading", { level: 1, name: editedName }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/characters/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await deleteViaDangerZone(page, "character");
    await page.waitForURL("**/characters");
    await expect(page.getByText(editedName)).toHaveCount(0);
  });
});
