import { expect, test } from "@playwright/test";

/**
 * Event CRUD spine — drives create → view → edit → delete through the UI
 * (no seeding). Self-cleaning: the event it creates is removed in the final
 * step. Mirrors the timeline CRUD spine; the only event-specific bits are the
 * route/placeholder ("Event title") and the "Delete event?" dialog.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("event CRUD spine", () => {
  test("create, view, edit, then delete an event", async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E CRUD Event ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    // Type defaults to "milestone"; a primary timeline is optional.
    await page.goto("/events/new");
    await page.getByPlaceholder("Event title").fill(title);
    // The Start span is a popover: open it, fill the year (era defaults to CE),
    // Apply. "Year" is matched exactly so it doesn't hit "Uncertainty (± years)".
    await page.getByRole("button", { name: "Add date" }).first().click();
    await page.getByLabel("Year", { exact: true }).fill("1969");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // ── View ────────────────────────────────────────────────────────────
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(slug).not.toBe("new");

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/events/${slug}/edit`);
    const titleField = page.getByPlaceholder("Event title");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/events/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Danger zone" }).click();
    await page.getByRole("button", { name: "Delete event" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete event?" });
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // Deleting redirects to the list; the event is gone.
    await page.waitForURL("**/events");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
