import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupCharactersList,
  seedCharactersList,
  type CharactersListFixture,
} from "../support/characters-list-fixture";
import {
  expectFilteredHeader,
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Characters list-page shell — the same loading / empty / error / filtered /
 * bulk coverage the events (#378) and timelines (#379) lists got, applied to
 * the characters list. Third entity in the per-list rollout under #355; reuses
 * the shared `list-helpers.ts` (the characters FilterRail is all checkboxes).
 *
 * Runs under the `authenticated` project (starts signed in). A per-suite,
 * self-cleaning fixture seeds a small varied set of characters owned by the
 * test user; the real-data tests isolate those rows by searching the seeded
 * stamp (the shared DB is non-deterministic — we never assert on global
 * counts). The three states a real, non-empty DB won't produce on cue
 * (loading/error/empty) are forced with route interception scoped to the
 * `characters` read (which also covers the facet-count queries — harmless,
 * since the list's own state is driven by useCharactersPage alone).
 *
 * Serial so the fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("characters list-page shell", () => {
  let fx: CharactersListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedCharactersList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupCharactersList(fx.stamp);
    }
  });

  /** Land on the characters list filtered (via search) to exactly the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/characters");
    await searchList(page, String(fx.stamp));
    await page.waitForURL(/[?&]q=/);
    await expect(page.getByText(fx.characters[0]!.name)).toBeVisible();
  }

  test("populated: renders seeded rows with sort + pagination controls", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const c of fx.characters) {
      await expect(page.getByText(c.name)).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Previous page" }),
    ).toBeVisible();
    await expect(page.locator("#character-sort-select")).toBeVisible();
  });

  test("filters: type checkbox narrows results and flags the header", async ({
    page,
  }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "type", "human");
    await page.waitForURL(/type=human/);
    await expectFilteredHeader(page);

    // The two `human` seeded rows remain; the animal and mythological ones
    // drop out.
    await expect(page.getByText(fx.characters[0]!.name)).toBeVisible();
    await expect(page.getByText(fx.characters[3]!.name)).toBeVisible();
    await expect(page.getByText(fx.characters[1]!.name)).toHaveCount(0);
    await expect(page.getByText(fx.characters[2]!.name)).toHaveCount(0);
  });

  test("filters: Clear all resets the query", async ({ page }) => {
    await page.goto(`/characters?q=${fx.stamp}&type=human`);
    await expectFilteredHeader(page);

    await page.getByRole("button", { name: "Clear all" }).click();
    await page.waitForURL(/\/characters\??$/);
    await expect(page.getByText(/·\s*filtered/)).toHaveCount(0);
  });

  test("filtered-empty: a no-match search shows the empty message", async ({
    page,
  }) => {
    await page.goto("/characters?q=zzznomatchqqq");

    await expect(
      page.getByText("No characters match these filters."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.waitForURL(/\/characters\??$/);
    await expect(
      page.getByText("No characters match these filters."),
    ).toHaveCount(0);
  });

  test("bulk: select all seeded rows and publish them", async ({ page }) => {
    await gotoSeeded(page);

    await page.getByRole("checkbox", { name: "Select all" }).click();

    const bar = page.getByRole("region", { name: "Bulk actions" });
    await expect(bar).toBeVisible();
    await expect(bar.getByText("4 selected")).toBeVisible();

    await bar.getByRole("button", { name: "Publish", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Publish 4 characters\?/)).toBeVisible();
    await dialog.getByRole("button", { name: "Publish", exact: true }).click();

    // All four seeded rows now read as published. Scope the count to the table
    // body rows: the "Published" column header <th>, the filter-rail "Published"
    // checkbox (in the <aside>), and the "Published 4 characters." success toast
    // all live outside <tbody>.
    await expect(
      page.locator("tbody").getByText("Published", { exact: true }),
    ).toHaveCount(4);
  });

  test("loading: the loading state shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "characters", 3000);
    await page.goto("/characters");

    await expect(page.getByText("Loading…")).toBeVisible();
    await expect(page.getByText("Loading…")).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "characters");
    await page.goto("/characters");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load characters." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load characters.")).toBeHidden();
  });

  test("true-empty: an empty list shows the 'No characters yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "characters");
    await page.goto("/characters");

    await expect(page.getByText(/No characters yet\./)).toBeVisible();

    await unroute();
  });
});
