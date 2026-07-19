import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupStoriesList,
  seedStoriesList,
  type StoriesListFixture,
} from "../support/stories-list-fixture";
import {
  expectFilteredHeader,
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Stories list-page shell — the states and shared surfaces every entity list is
 * built from (loading / hard-error / true-empty / filtered-empty, the
 * FilterRail, and the BulkActionBar), exercised on the stories list. The 7 CRUD
 * spines only drive the detail happy path; this fills the untested list surface.
 *
 * Stories is URL-driven (like events/timelines/characters): search/filter/sort
 * live in the query string, so the real-data tests wait on the URL after driving
 * the shared filter UI. Runs under the `authenticated` project (starts signed
 * in). A per-suite fixture seeds a small, varied, self-cleaning set of stories
 * owned by the test user; the real-data tests isolate those rows by searching
 * the seeded stamp (the shared DB is non-deterministic — we never assert on
 * global counts). Loading/error/empty are forced with route interception scoped
 * to the `stories` read only.
 *
 * Serial so the fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("stories list-page shell", () => {
  let fx: StoriesListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedStoriesList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupStoriesList(fx.stamp);
    }
  });

  /** Land on the stories list filtered (via search) to exactly the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/stories");
    await searchList(page, String(fx.stamp));
    await page.waitForURL(/[?&]q=/);
    await expect(page.getByText(fx.stories[0]!.title)).toBeVisible();
  }

  test("populated: renders seeded rows with sort + pagination controls", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const s of fx.stories) {
      await expect(page.getByText(s.title)).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Previous page" }),
    ).toBeVisible();
    await expect(page.locator("#story-sort-select")).toBeVisible();
  });

  test("filters: narrator checkbox narrows results and flags the header", async ({
    page,
  }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "narrator", "third_person");
    await page.waitForURL(/narrator=third_person/);
    await expectFilteredHeader(page);

    // The two third_person seeded rows remain; the two omniscient ones drop out.
    await expect(page.getByText(fx.stories[0]!.title)).toBeVisible();
    await expect(page.getByText(fx.stories[1]!.title)).toBeVisible();
    await expect(page.getByText(fx.stories[2]!.title)).toHaveCount(0);
    await expect(page.getByText(fx.stories[3]!.title)).toHaveCount(0);
  });

  test("filters: Clear all resets the query", async ({ page }) => {
    await page.goto(`/stories?q=${fx.stamp}&narrator=third_person`);
    await expectFilteredHeader(page);

    await page.getByRole("button", { name: "Clear all" }).click();
    await page.waitForURL(/\/stories\??$/);
    await expect(page.getByText(/·\s*filtered/)).toHaveCount(0);
  });

  test("filtered-empty: a no-match search shows the empty message", async ({
    page,
  }) => {
    await page.goto("/stories?q=zzznomatchqqq");

    await expect(
      page.getByText("No stories match these filters."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.waitForURL(/\/stories\??$/);
    await expect(page.getByText("No stories match these filters.")).toHaveCount(
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
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Publish", exact: true }).click();

    // All four seeded rows now read as published. Scope the count to the table
    // BODY: the stories status column header is literally "Published" (a <th>),
    // and the filter-rail "Published" checkbox + the success toast also carry
    // the word — only <tbody> holds exactly the four row badges.
    await expect(
      page.locator("tbody").getByText("Published", { exact: true }),
    ).toHaveCount(4);
  });

  test("loading: the loading state shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "stories", 3000);
    await page.goto("/stories");

    await expect(page.getByText("Loading…")).toBeVisible();
    await expect(page.getByText("Loading…")).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "stories");
    await page.goto("/stories");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load stories." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load stories.")).toBeHidden();
  });

  test("true-empty: an empty list shows the 'No stories yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "stories");
    await page.goto("/stories");

    await expect(page.getByText(/No stories yet\./)).toBeVisible();

    await unroute();
  });
});
