import { expect, test } from "@playwright/test";
import { sweepCrudLeftovers } from "../support/cleanup";
import {
  deleteViaDangerZone,
  expectDetailAndReadSlug,
  saveForm,
  setStartDate,
} from "../support/crud-helpers";

/**
 * Event CRUD spine — drives create → view → edit → delete through the UI
 * (no seeding). Self-cleaning: the event it creates is removed in the final
 * step. Type defaults to "milestone" and a primary timeline is optional, so
 * a title + start date is all that's required to create.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("event CRUD spine", () => {
  // Safety net for the run that doesn't reach its delete step (#355).
  const stamps: number[] = [];
  test.afterAll(async () => {
    await sweepCrudLeftovers(
      "events",
      stamps.map((s) => `e2e-crud-event-${s}%`),
    );
  });

  test("create, view, edit, then delete an event", async ({ page }) => {
    const stamp = Date.now();
    stamps.push(stamp);
    const title = `E2E CRUD Event ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create ──────────────────────────────────────────────────────────
    await page.goto("/events/new");
    await page.getByPlaceholder("Event title").fill(title);
    await setStartDate(page, 1969);
    await saveForm(page);

    // ── View ────────────────────────────────────────────────────────────
    const slug = await expectDetailAndReadSlug(page, title);

    // ── Edit ────────────────────────────────────────────────────────────
    await page.goto(`/events/${slug}/edit`);
    const titleField = page.getByPlaceholder("Event title");
    await expect(titleField).toHaveValue(title);
    await titleField.fill(editedTitle);
    await saveForm(page);

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/events/${slug}$`));

    // ── Delete ──────────────────────────────────────────────────────────
    await deleteViaDangerZone(page, "event");
    await page.waitForURL("**/events");
    await expect(page.getByText(editedTitle)).toHaveCount(0);
  });
});
