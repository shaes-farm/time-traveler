import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupEventsList,
  seedEventsList,
  type EventsListFixture,
} from "../support/events-list-fixture";
import {
  expectFilteredHeader,
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Events list-page shell — the states and shared surfaces every entity list is
 * built from, exercised here on the richest one (events). The 7 CRUD spines
 * only drive the detail happy path; this fills the untested list surface:
 * loading / hard-error / true-empty / filtered-empty, the FilterRail, and the
 * BulkActionBar.
 *
 * Runs under the `authenticated` project (starts signed in). A per-suite
 * fixture seeds a small, varied, self-cleaning set of events owned by the test
 * user; the real-data tests isolate those rows by searching the seeded stamp
 * (the shared DB is non-deterministic — we never assert on global counts). The
 * three states a real, non-empty DB won't produce on cue (loading/error/empty)
 * are forced with route interception scoped to the `events` read only.
 *
 * Serial so the fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("events list-page shell", () => {
  let fx: EventsListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedEventsList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupEventsList(fx.stamp);
    }
  });

  /** Land on the events list filtered (via search) to exactly the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/events");
    await searchList(page, String(fx.stamp));
    await page.waitForURL(/[?&]q=/);
    await expect(page.getByText(fx.events[0]!.title)).toBeVisible();
  }

  test("populated: renders seeded rows with sort + pagination controls", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const e of fx.events) {
      await expect(page.getByText(e.title)).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Previous page" }),
    ).toBeVisible();
    await expect(page.locator("#event-sort-select")).toBeVisible();
  });

  test("filters: era checkbox narrows results and flags the header", async ({
    page,
  }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "era", "CE");
    await page.waitForURL(/era=CE/);
    await expectFilteredHeader(page);

    // The two CE seeded rows remain; the BCE and MYA ones drop out.
    await expect(page.getByText(fx.events[0]!.title)).toBeVisible();
    await expect(page.getByText(fx.events[1]!.title)).toBeVisible();
    await expect(page.getByText(fx.events[2]!.title)).toHaveCount(0);
    await expect(page.getByText(fx.events[3]!.title)).toHaveCount(0);
  });

  test("filters: Clear all resets the query", async ({ page }) => {
    await page.goto(`/events?q=${fx.stamp}&era=CE`);
    await expectFilteredHeader(page);

    await page.getByRole("button", { name: "Clear all" }).click();
    await page.waitForURL(/\/events\??$/);
    await expect(page.getByText(/·\s*filtered/)).toHaveCount(0);
  });

  test("filtered-empty: a no-match search shows the empty message", async ({
    page,
  }) => {
    await page.goto("/events?q=zzznomatchqqq");

    await expect(
      page.getByText("No events match these filters."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.waitForURL(/\/events\??$/);
    await expect(page.getByText("No events match these filters.")).toHaveCount(
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
    await expect(dialog.getByText(/Publish 4 events\?/)).toBeVisible();
    await dialog.getByRole("button", { name: "Publish", exact: true }).click();

    // All four seeded rows now read as published. Scope the count to the table
    // rows: the filter-rail "Published" checkbox (in the <aside>) and the
    // "Published 4 events." success toast both live outside it.
    await expect(
      page.getByRole("table").getByText("Published", { exact: true }),
    ).toHaveCount(4);
  });

  test("loading: the loading state shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "events", 3000);
    await page.goto("/events");

    await expect(page.getByText("Loading…")).toBeVisible();
    await expect(page.getByText("Loading…")).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "events");
    await page.goto("/events");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load events." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load events.")).toBeHidden();
  });

  test("true-empty: an empty list shows the 'No events yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "events");
    await page.goto("/events");

    await expect(page.getByText(/No events yet\./)).toBeVisible();

    await unroute();
  });
});
