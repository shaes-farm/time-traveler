import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the entity CRUD spine specs (timelines, events,
 * characters, …). They encapsulate the fiddly, gotcha-prone parts of driving
 * the admin forms, so each spine reads as a plain create → view → edit →
 * delete journey and the selector quirks live in exactly one place.
 */

/**
 * Click the form's primary Save button.
 *
 * `exact` is required: a substring match on "Save" also matches the
 * SaveDropdown's "More save actions" trigger.
 */
export async function saveForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save", exact: true }).click();
}

/**
 * Fill a required Start temporal span through its popover: open "+ Add date"
 * (the Start input renders before the optional End one), set the year (era
 * defaults to CE), and Apply.
 *
 * `exact` on "Year" avoids also matching the prehistoric
 * "Uncertainty (± years)" field.
 */
export async function setStartDate(page: Page, year: number): Promise<void> {
  await page.getByRole("button", { name: "Add date" }).first().click();
  await page.getByLabel("Year", { exact: true }).fill(String(year));
  await page.getByRole("button", { name: "Apply" }).click();
}

/**
 * Assert we've landed on an entity detail page whose `<h1>` is `heading`
 * (only the detail page renders it — so this also confirms a create/edit
 * redirect landed) and return the slug from the URL. The `!== "new"` guard
 * catches a create form that failed to redirect off `/new`.
 */
export async function expectDetailAndReadSlug(
  page: Page,
  heading: string,
): Promise<string> {
  await expect(
    page.getByRole("heading", { level: 1, name: heading }),
  ).toBeVisible();
  const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
  expect(slug).not.toBe("new");
  return slug;
}

/**
 * Delete the current entity from its detail page: expand the owner-only
 * "Danger zone", trigger "Delete <entity>", and confirm the "Delete
 * <entity>?" dialog. `entity` is the lowercase noun as it appears in the UI
 * ("timeline", "event", "character").
 */
export async function deleteViaDangerZone(
  page: Page,
  entity: string,
): Promise<void> {
  await page.getByRole("button", { name: "Danger zone" }).click();
  await page.getByRole("button", { name: `Delete ${entity}` }).click();
  const dialog = page.getByRole("dialog", { name: `Delete ${entity}?` });
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
}
