import { expect, test } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupCategoriesList,
  seedCategoriesList,
  type CategoriesListFixture,
} from "../support/categories-list-fixture";
import {
  mockListEmpty,
  mockListError,
  mockListLoading,
} from "../support/list-helpers";

/**
 * Categories manager shell — the states the category CRUD spine
 * (category-crud.spec.ts) never reaches: **loading, hard-error, and
 * true-empty**. Same intent as the other entity list-shell specs under #355,
 * but categories is the outlier: a two-pane tree + inspector manager, not a
 * list/detail surface. It has NO search / FilterRail / BulkActionBar /
 * pagination, so the shared filter + bulk surfaces don't apply — the shell here
 * is the tree pane's three query states plus its populated header.
 *
 * The three states a real, non-empty DB won't produce on cue are forced with
 * route interception scoped to the tree read (`categories`). The category
 * usage-count query hits a different resource (`event_categories`), so the mock
 * leaves it untouched — the tree pane's state is driven by the tree query alone.
 * A per-suite fixture seeds two root categories (self-cleaning) for the
 * populated assertion; the manager header counts ALL of the user's categories,
 * so the spec matches the summary line's shape and the seeded nodes' titles
 * rather than an exact (non-deterministic) global count.
 *
 * Serial so the fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("categories manager shell", () => {
  let fx: CategoriesListFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedCategoriesList(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupCategoriesList(fx.stamp);
    }
  });

  test("populated: the tree renders the seeded roots and the header summary", async ({
    page,
  }) => {
    await page.goto("/categories");

    // Both seeded roots appear as top-level tree items (they have no parent).
    for (const c of fx.categories) {
      await expect(
        page.getByRole("treeitem").filter({ hasText: c.title }),
      ).toBeVisible();
    }

    // The header summary line renders once the tree loads. Assert its shape
    // ("N categories · M roots"), never an exact count — the shared DB holds
    // an unknown number of other categories.
    await expect(page.getByText(/categor(y|ies) · \d+ root/)).toBeVisible();
  });

  test("loading: the skeleton shows while the tree query is in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(page, "categories", 3000);
    await page.goto("/categories");

    // The tree pane renders animate-pulse skeleton rows while pending; they
    // clear once the (delayed) response resolves and the tree renders.
    const skeleton = page.locator("main .animate-pulse");
    await expect(skeleton.first()).toBeVisible();
    await expect(skeleton).toHaveCount(0, { timeout: 15_000 });

    await unroute();
  });

  test("error: a failed load shows the inline alert and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "categories");
    await page.goto("/categories");

    // Target the alert by its title text — Next's route announcer is also
    // role="alert". The `.` tolerates the title's curly apostrophe encoding.
    await expect(page.getByText(/Couldn.t load categories/)).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText(/Couldn.t load categories/)).toBeHidden();
  });

  test("true-empty: an empty tree shows the 'No categories yet' state", async ({
    page,
  }) => {
    const unroute = await mockListEmpty(page, "categories");
    await page.goto("/categories");

    await expect(page.getByText("No categories yet")).toBeVisible();

    await unroute();
  });
});
