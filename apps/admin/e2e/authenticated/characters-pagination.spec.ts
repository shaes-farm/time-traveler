import { expect, test } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupCharactersPageOverflow,
  seedCharactersPageOverflow,
  PAGE_SIZE,
  type CharactersPageOverflowFixture,
} from "../support/characters-pagination-fixture";

/**
 * Characters list pagination clamp — regression coverage for #330 (a list page
 * must not strand the user on an out-of-range page). Both entry paths are
 * exercised on characters; the clamp itself is byte-identical across the four
 * paginated list clients (characters/events/stories/timelines), so one entity's
 * coverage guards the shared implementation. The list-shell specs already assert
 * every list renders its pagination controls.
 *
 * Both scenarios reach the clamp through the same in-range response (from ==
 * count → PostgREST 206 empty, not a 416 error), which is exactly the state
 * `getCharactersPage` returns when the current page sits just past a shrunken
 * result set. A deep link far beyond the end (from > count) instead 416s into
 * the list's error state — a separate, pre-existing gap the clamp deliberately
 * does not touch (it is gated on !isError so a transient error never yanks the
 * user off their page).
 *
 * Runs under the `authenticated` project (starts signed in) against the real
 * backend. Serial so each fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("characters list pagination clamp — deep link", () => {
  let fx: CharactersPageOverflowFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    // Exactly one full page: a deep link to page 2 requests offset == count,
    // the empty boundary that triggers the clamp without any mutation.
    fx = await seedCharactersPageOverflow(userId, PAGE_SIZE);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupCharactersPageOverflow(fx.stamp);
    }
  });

  test("landing on an empty page-past-the-end clamps to the last valid page", async ({
    page,
  }) => {
    // 20 seeded rows fill page 1 exactly; page 2 is empty. Deep-linking there
    // must auto-correct after the data loads (the clamp is gated on !isPending,
    // so it fires once, not before the initial load resolves): page 1 is the
    // last valid page, so the param is dropped entirely and the rows render
    // instead of a blank table.
    await page.goto(`/characters?page=2&q=${fx.stamp}`);
    await page.waitForURL((url) => !url.searchParams.has("page"));
    // The clamp does a second round-trip (empty page 2 → refetch page 1), so
    // allow the shell's usual generous timeout for the rows to land.
    await expect(page.getByText(fx.names[0]!)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("characters list pagination clamp — bulk delete", () => {
  let fx: CharactersPageOverflowFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    // One row past a full page so a single character sits alone on page 2;
    // deleting it shrinks the set to one page.
    fx = await seedCharactersPageOverflow(userId, PAGE_SIZE + 1);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupCharactersPageOverflow(fx.stamp);
    }
  });

  test("deleting the last page's only row clamps off the now-empty page", async ({
    page,
  }) => {
    // 21 seeded rows filtered by stamp → page 2 holds exactly one. Land there
    // directly; page 2 is valid at this point, so nothing clamps yet.
    await page.goto(`/characters?page=2&q=${fx.stamp}`);
    await page.waitForURL(/[?&]page=2/);

    // Exactly one row on page 2 → "Select all" selects just that row.
    await page.getByRole("checkbox", { name: "Select all" }).click();
    const bar = page.getByRole("region", { name: "Bulk actions" });
    await expect(bar.getByText("1 selected")).toBeVisible();

    // Delete → batched confirm dialog → confirm. (The bar button and the dialog
    // button both read "Delete", so scope each to its container.)
    await bar.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Delete 1 character\?/)).toBeVisible();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // The delete drops total to 20 (one page). The clamp must move off page 2;
    // page 1 is the last valid page, so the param is dropped and the remaining
    // rows render instead of a blank table.
    await page.waitForURL((url) => !url.searchParams.has("page"));
    // The clamp does a second round-trip (empty page 2 → refetch page 1), so
    // allow the shell's usual generous timeout for the rows to land.
    await expect(page.getByText(fx.names[0]!)).toBeVisible({ timeout: 15_000 });
  });
});
