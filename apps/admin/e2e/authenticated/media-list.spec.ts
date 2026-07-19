import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupMediaList,
  seedMediaList,
  type MediaListFixture,
} from "../support/media-list-fixture";
import {
  mockListEmpty,
  mockListError,
  mockListLoading,
  searchList,
  toggleFilterCheckbox,
} from "../support/list-helpers";

/**
 * Media library shell — the states and shared surfaces the media CRUD spine
 * (#373, external-URL path) never touches: loading / hard-error / true-empty /
 * filtered-empty, the MediaFilterRail, and the orphan bulk-delete footer. Last
 * of the seven entity lists under #355.
 *
 * Media is the most divergent surface: the cross-entity library (screen 17) is
 * a MediaPicker browse grid, not a list/detail table. Like periods, its
 * search/facets/view/cursor are **client-side local state** (URL only seeds the
 * initial facets), so the real-data tests never wait on the URL — they assert
 * card visibility directly. But search + facets still drive SERVER queries, so
 * the real-data tests isolate the seeded rows by searching the stamp baked into
 * every altText/slug (the shared DB is non-deterministic — we never assert on
 * global counts). Loading/error/empty are forced with route interception scoped
 * to the library read (`media`); the facet-count queries hit the same resource
 * (harmless), while the detail-drawer junction reads (`event_media` etc.) are a
 * different resource the mock leaves untouched.
 *
 * Serial so the fixture seeds once and tears down once. The bulk-delete test
 * removes the seeded rows, so it runs LAST among the real-data tests.
 */
test.describe.configure({ mode: "serial" });

test.describe("media library shell", () => {
  let fx: MediaListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedMediaList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupMediaList(fx.stamp);
    }
  });

  /** Land on the library filtered (via search) to exactly the seeded rows. */
  async function gotoSeeded(page: Page): Promise<void> {
    await page.goto("/media");
    await searchList(page, String(fx.stamp));
    await expect(page.getByText(fx.media[0]!.altText)).toBeVisible();
  }

  test("populated: renders the seeded cards with the grid/list + pager controls", async ({
    page,
  }) => {
    await gotoSeeded(page);

    for (const m of fx.media) {
      await expect(page.getByText(m.altText)).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Grid view" })).toBeVisible();
    // `exact` — a bare "Next" also matches the Next.js dev-tools button.
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeVisible();
  });

  test("filters: the Type facet narrows the grid", async ({ page }) => {
    await gotoSeeded(page);

    await toggleFilterCheckbox(page, "type", "image");

    // The two image rows remain; the video and audio ones drop out.
    await expect(page.getByText(fx.media[0]!.altText)).toBeVisible();
    await expect(page.getByText(fx.media[1]!.altText)).toBeVisible();
    await expect(page.getByText(fx.media[2]!.altText)).toHaveCount(0);
    await expect(page.getByText(fx.media[3]!.altText)).toHaveCount(0);
  });

  test("filtered-empty: a no-match search shows the empty message and Clear filters resets", async ({
    page,
  }) => {
    await page.goto("/media");
    await searchList(page, "zzznomatchqqq");

    await expect(page.getByText("No media match these filters.")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("No media match these filters.")).toHaveCount(
      0,
    );
  });

  test("loading: the skeleton grid shows while the query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "media", 3000);
    await page.goto("/media");

    const skeleton = page.getByTestId("media-grid-skeleton");
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toBeHidden({ timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "media");
    await page.goto("/media");

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load media." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load media.")).toBeHidden();
  });

  test("true-empty: an empty library shows the 'No media yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "media");
    await page.goto("/media");

    await expect(page.getByText(/No media yet\./)).toBeVisible();

    await unroute();
  });

  // Destructive — deletes the seeded rows; keep LAST among the real-data tests.
  test("bulk: Orphaned filter enables select + Delete selected clears the rows", async ({
    page,
  }) => {
    await gotoSeeded(page);

    // Bulk select is offered only when filtered to exactly Orphaned (screen-17
    // edge case) — the seeded rows are all orphaned, so all four stay visible.
    await toggleFilterCheckbox(page, "attached-to", "orphaned");

    const selects = page.getByRole("checkbox", {
      name: new RegExp(`^Select E2E List ${fx.stamp}`),
    });
    await expect(selects).toHaveCount(4);
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      await selects.nth(i).click();
    }

    const footer = page.getByText("4 selected");
    await expect(footer).toBeVisible();

    await page.getByRole("button", { name: "Delete selected" }).click();

    // The rows are gone from the grid (no confirmation dialog on this path).
    for (const m of fx.media) {
      await expect(page.getByText(m.altText)).toHaveCount(0);
    }
  });
});
