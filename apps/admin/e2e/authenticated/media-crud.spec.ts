import { expect, test } from "@playwright/test";
import { sweepCrudLeftovers } from "../support/cleanup";

/**
 * Media CRUD spine — external-URL path.
 *
 * Media diverges from the other entities: a single `/media` library surface
 * with an add dialog and a detail drawer, no per-item routes. This drives
 * create (external URL — no Storage upload) → view in the grid → edit metadata
 * in the drawer → delete-with-confirm. Self-cleaning.
 *
 * The file-upload path (real file → Supabase Storage) is tracked separately on
 * #355 as an optional follow-up.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe("media CRUD spine (external URL)", () => {
  // Safety net for the run that doesn't reach its delete step (#355). The
  // media slug derives from the URL's last path segment minus its extension
  // (`createExternalMedia`), so `https://example.com/e2e-<stamp>.jpg` lands
  // as `e2e-<stamp>` — the trailing `%` also covers a collision suffix.
  const stamps: number[] = [];
  test.afterAll(async () => {
    await sweepCrudLeftovers(
      "media",
      stamps.map((s) => `e2e-${s}%`),
    );
  });

  test("add external media, view, edit its metadata, then delete", async ({
    page,
  }) => {
    const stamp = Date.now();
    stamps.push(stamp);
    const alt = `E2E Media ${stamp}`;
    const editedAlt = `${alt} (edited)`;

    // ── Create (external URL) ───────────────────────────────────────────
    await page.goto("/media");
    await page.getByRole("button", { name: "External URL" }).click();
    const addDialog = page.getByRole("dialog", { name: "Add to library" });
    await addDialog
      .getByLabel("URL", { exact: true })
      .fill(`https://example.com/e2e-${stamp}.jpg`);
    // Alt text becomes the item's label (media_label = alt_text || caption || slug).
    await addDialog.getByLabel("Alt text").fill(alt);
    await addDialog.getByRole("button", { name: "Add", exact: true }).click();

    // ── View in the grid ────────────────────────────────────────────────
    await expect(page.getByRole("button", { name: alt })).toBeVisible();

    // ── Edit metadata via the drawer ────────────────────────────────────
    await page.getByRole("button", { name: alt }).click();
    const drawer = page.getByRole("dialog", { name: alt });
    await expect(drawer).toBeVisible();
    await drawer.getByLabel("Alt text").fill(editedAlt);
    await drawer.getByRole("button", { name: "Save changes" }).click();
    await page.keyboard.press("Escape");

    // The grid reflects the edited label (persisted + list invalidated).
    await expect(page.getByRole("button", { name: editedAlt })).toBeVisible();

    // ── Delete (blast-radius confirm) ───────────────────────────────────
    await page.getByRole("button", { name: editedAlt }).click();
    await page.getByRole("button", { name: "Delete original" }).click();
    const confirm = page.getByRole("alertdialog", {
      name: "Delete this media?",
    });
    // The trigger is "Delete original…" (ellipsis); the confirm action is
    // "Delete original" (scoped to the alertdialog).
    await confirm
      .getByRole("button", { name: "Delete original", exact: true })
      .click();

    await expect(page.getByText(editedAlt)).toHaveCount(0);
  });
});
