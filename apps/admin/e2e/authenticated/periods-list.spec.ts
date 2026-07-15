import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupPeriodsList,
  seedPeriodsList,
  type PeriodsListFixture,
} from "../support/periods-list-fixture";
import {
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Periods list-page shell — the same loading / empty / error / filtered / bulk
 * coverage the events (#378), timelines (#379), and characters (#380) lists
 * got, applied to the periods list. Fourth entity in the per-list rollout
 * under #355.
 *
 * Periods is the outlier: its search + filters + sort are all **client-side
 * local state** (no URL params, no server pagination). It fetches the full set
 * (`pageSize: 100`) and filters in memory. So this spec diverges from the
 * URL-driven template in three ways:
 *   - no `waitForURL` after search / filter — the filtering is synchronous
 *     local state, so we assert on row visibility directly;
 *   - the filtered header reads `"N of M shown"`, not `"· filtered"` (so the
 *     shared `expectFilteredHeader` helper doesn't apply);
 *   - there is no pagination footer to assert.
 * The route-mock + checkbox helpers still apply unchanged.
 *
 * The bulk action drives publish (`publishPeriod` has no precondition). Serial
 * so the self-cleaning fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("periods list-page shell", () => {
  let fx: PeriodsListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedPeriodsList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupPeriodsList(fx.stamp);
    }
  });

  /** Land on the periods list and client-side-search down to the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/periods");
    await searchList(page, String(fx.stamp));
    await expect(page.getByText(fx.periods[0]!.title)).toBeVisible();
  }

  test("populated: renders seeded rows with a sort control", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const p of fx.periods) {
      await expect(page.getByText(p.title)).toBeVisible();
    }
    // Client-side list: a sort control, but no server pagination footer.
    await expect(page.locator("#period-sort-select")).toBeVisible();
  });

  test("filters: significance checkbox narrows results and flags the header", async ({
    page,
  }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "significance", "high");

    // The two `high` seeded rows remain; the medium and low ones drop out.
    await expect(page.getByText(fx.periods[0]!.title)).toBeVisible();
    await expect(page.getByText(fx.periods[1]!.title)).toBeVisible();
    await expect(page.getByText(fx.periods[2]!.title)).toHaveCount(0);
    await expect(page.getByText(fx.periods[3]!.title)).toHaveCount(0);
    // Periods' filtered-count header variant ("N of M shown").
    await expect(page.getByText(/\d+ of \d+ shown/)).toBeVisible();

    // Clear all resets search + filters (client-side): the filtered header goes
    // away and a previously-hidden seeded row comes back.
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.getByText(/\d+ of \d+ shown/)).toHaveCount(0);
    await expect(page.getByText(fx.periods[2]!.title)).toBeVisible();
  });

  test("filtered-empty: a no-match search shows the empty message", async ({
    page,
  }) => {
    await page.goto("/periods");
    await searchList(page, "zzznomatchqqq");

    await expect(
      page.getByText("No periods match these filters."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("No periods match these filters.")).toHaveCount(
      0,
    );
  });

  test("bulk: select all seeded rows and publish them", async ({ page }) => {
    await gotoSeeded(page);

    await page.getByRole("checkbox", { name: "Select all" }).click();

    const bar = page.getByRole("region", { name: "Bulk actions" });
    await expect(bar).toBeVisible();
    await expect(bar.getByText("4 selected")).toBeVisible();

    await bar.getByRole("button", { name: "Publish", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Publish 4 periods\?/)).toBeVisible();
    await dialog.getByRole("button", { name: "Publish", exact: true }).click();

    // All four seeded rows now read as published. Scope the count to <tbody> so
    // the "Published 4 periods." success toast (outside the table) doesn't count.
    await expect(
      page.locator("tbody").getByText("Published", { exact: true }),
    ).toHaveCount(4);
  });

  test("loading: the loading state shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "periods", 3000);
    await page.goto("/periods");

    await expect(page.getByText("Loading…")).toBeVisible();
    await expect(page.getByText("Loading…")).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "periods");
    await page.goto("/periods");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load periods." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load periods.")).toBeHidden();
  });

  test("true-empty: an empty list shows the 'No periods yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "periods");
    await page.goto("/periods");

    await expect(page.getByText(/No periods yet\./)).toBeVisible();

    await unroute();
  });
});
