import { expect, test } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupEventsPageOverflow,
  seedEventsPageOverflow,
  PAGE_SIZE,
  type EventsPageOverflowFixture,
} from "../support/events-pagination-fixture";

/**
 * Events list pagination clamp — regression coverage for #330 (a list page must
 * not strand the user on an out-of-range page). The events list has no bulk
 * delete (only publish/unpublish), so the reachable clamp trigger is a deep
 * link to an empty page-past-the-end; the clamp itself is byte-identical across
 * the four paginated list clients. See `characters-pagination.spec.ts` for the
 * full-scenario (bulk-delete) coverage and the from == count / from > count
 * explanation.
 *
 * Runs under the `authenticated` project (starts signed in). Serial so the
 * fixture seeds once and tears down once.
 */
test.describe.configure({ mode: "serial" });

test.describe("events list pagination clamp — deep link", () => {
  let fx: EventsPageOverflowFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    // Exactly one full page: a deep link to page 2 requests offset == count,
    // the empty boundary that triggers the clamp without any mutation.
    fx = await seedEventsPageOverflow(userId, PAGE_SIZE);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupEventsPageOverflow(fx.stamp);
    }
  });

  test("landing on an empty page-past-the-end clamps to the last valid page", async ({
    page,
  }) => {
    // 20 seeded rows fill page 1 exactly; page 2 is empty. Deep-linking there
    // must auto-correct after the data loads (the clamp is gated on !isPending):
    // page 1 is the last valid page, so the param is dropped and the rows render
    // instead of a blank table.
    await page.goto(`/events?page=2&q=${fx.stamp}`);
    await page.waitForURL((url) => !url.searchParams.has("page"));
    // The clamp does a second round-trip (empty page 2 → refetch page 1), so
    // allow the shell's usual generous timeout for the rows to land.
    await expect(page.getByText(fx.titles[0]!)).toBeVisible({
      timeout: 15_000,
    });
  });
});
