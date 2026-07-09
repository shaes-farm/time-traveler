import { expect, test } from "@playwright/test";

/**
 * Timeline CRUD spine — drives the full create → view → edit → delete
 * journey through the UI (no seeding). Self-cleaning: the timeline it
 * creates is removed in the final step. This establishes the form-driving
 * patterns the other entity CRUD specs will reuse.
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
    // The Start span is a popover: open it, fill the year (era defaults to CE),
    // and Apply. The Start input renders before the optional End one.
    await page.getByRole("button", { name: "Add date" }).first().click();
    // Exact match: "Year" would otherwise also hit "Uncertainty (± years)".
    await page.getByLabel("Year", { exact: true }).fill("2000");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // ── View ────────────────────────────────────────────────────────────
    // The <h1> only renders on the detail page, so seeing it also confirms
    // the create → redirect landed.
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(slug).not.toBe("new");

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/timelines/${slug}/edit`);
    const titleField = page.getByPlaceholder("Timeline title");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/timelines/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Danger zone" }).click();
    await page.getByRole("button", { name: "Delete timeline" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete timeline?" });
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // Deleting redirects to the list; the timeline is gone.
    await page.waitForURL("**/timelines");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
