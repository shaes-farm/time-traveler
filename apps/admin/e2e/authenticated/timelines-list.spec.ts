import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupTimelinesList,
  seedTimelinesList,
  type TimelinesListFixture,
} from "../support/timelines-list-fixture";
import {
  expectFilteredHeader,
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Timelines list-page shell — the same loading / empty / error / filtered /
 * bulk coverage the events list got (#378), applied to the timelines list.
 * Second entity in the per-list rollout under #355; reuses the shared
 * `list-helpers.ts` (the timelines FilterRail is all checkboxes).
 *
 * Runs under the `authenticated` project (starts signed in). A per-suite,
 * self-cleaning fixture seeds a small varied set of timelines owned by the test
 * user; the real-data tests isolate those rows by searching the seeded stamp
 * (the shared DB is non-deterministic — we never assert on global counts). The
 * three states a real, non-empty DB won't produce on cue (loading/error/empty)
 * are forced with route interception scoped to the `timelines` read only.
 *
 * The bulk action drives **unpublish** rather than publish: publishing a
 * timeline is gated on it having a linked event (#212), so a bulk publish of
 * eventless seeded rows would fail the precondition.
 *
 * Serial so the fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("timelines list-page shell", () => {
  let fx: TimelinesListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedTimelinesList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupTimelinesList(fx.stamp);
    }
  });

  /** Land on the timelines list filtered (via search) to exactly the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/timelines");
    await searchList(page, String(fx.stamp));
    await page.waitForURL(/[?&]q=/);
    await expect(page.getByText(fx.timelines[0]!.title)).toBeVisible();
  }

  test("populated: renders seeded rows with sort + pagination controls", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const t of fx.timelines) {
      await expect(page.getByText(t.title)).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Previous page" }),
    ).toBeVisible();
    await expect(page.locator("#sort-select")).toBeVisible();
  });

  test("filters: type checkbox narrows results and flags the header", async ({
    page,
  }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "type", "general");
    await page.waitForURL(/type=general/);
    await expectFilteredHeader(page);

    // The two `general` seeded rows remain; the biographical and comparative
    // ones drop out.
    await expect(page.getByText(fx.timelines[0]!.title)).toBeVisible();
    await expect(page.getByText(fx.timelines[3]!.title)).toBeVisible();
    await expect(page.getByText(fx.timelines[1]!.title)).toHaveCount(0);
    await expect(page.getByText(fx.timelines[2]!.title)).toHaveCount(0);
  });

  test("filters: Clear all resets the query", async ({ page }) => {
    await page.goto(`/timelines?q=${fx.stamp}&type=general`);
    await expectFilteredHeader(page);

    await page.getByRole("button", { name: "Clear all" }).click();
    await page.waitForURL(/\/timelines\??$/);
    await expect(page.getByText(/·\s*filtered/)).toHaveCount(0);
  });

  test("filtered-empty: a no-match search shows the empty message", async ({
    page,
  }) => {
    await page.goto("/timelines?q=zzznomatchqqq");

    await expect(
      page.getByText("No timelines match these filters."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.waitForURL(/\/timelines\??$/);
    await expect(
      page.getByText("No timelines match these filters."),
    ).toHaveCount(0);
  });

  test("bulk: select all seeded rows and unpublish them", async ({ page }) => {
    await gotoSeeded(page);

    await page.getByRole("checkbox", { name: "Select all" }).click();

    const bar = page.getByRole("region", { name: "Bulk actions" });
    await expect(bar).toBeVisible();
    await expect(bar.getByText("4 selected")).toBeVisible();

    await bar.getByRole("button", { name: "Unpublish", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Unpublish 4 timelines\?/)).toBeVisible();
    await dialog
      .getByRole("button", { name: "Unpublish", exact: true })
      .click();

    // All four seeded rows now read as drafts. Scope the count to the table
    // rows: the filter-rail "Draft" checkbox (in the <aside>) and the
    // "Unpublished 4 timelines." success toast both live outside it.
    await expect(
      page.getByRole("table").getByText("Draft", { exact: true }),
    ).toHaveCount(4);
  });

  test("loading: the loading state shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "timelines", 3000);
    await page.goto("/timelines");

    await expect(page.getByText("Loading…")).toBeVisible();
    await expect(page.getByText("Loading…")).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "timelines");
    await page.goto("/timelines");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load timelines." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load timelines.")).toBeHidden();
  });

  test("true-empty: an empty list shows the 'No timelines yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "timelines");
    await page.goto("/timelines");

    await expect(page.getByText(/No timelines yet\./)).toBeVisible();

    await unroute();
  });
});
