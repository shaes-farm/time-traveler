import { expect, test } from "@playwright/test";

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
  test("create, view, edit, then delete a character", async ({ page }) => {
    const stamp = Date.now();
    const name = `E2E CRUD Character ${stamp}`;
    const editedName = `${name} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    // Type defaults to the first option; birth/death spans are optional.
    await page.goto("/characters/new");
    await page.getByPlaceholder("Character name").fill(name);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // ── View ────────────────────────────────────────────────────────────
    // The <h1> only renders on the detail page, so seeing it also confirms
    // the create → redirect landed.
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(slug).not.toBe("new");

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/characters/${slug}/edit`);
    const nameField = page.getByPlaceholder("Character name");
    await expect(nameField).toHaveValue(name);
    await nameField.fill(editedName);
    // Guard against a late form.reset() racing the fill before we submit.
    await expect(nameField).toHaveValue(editedName);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: editedName }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/characters/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Danger zone" }).click();
    await page.getByRole("button", { name: "Delete character" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete character?" });
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // Deleting redirects to the list; the character is gone.
    await page.waitForURL("**/characters");
    await expect(page.getByText(editedName)).toHaveCount(0);
  });
});
