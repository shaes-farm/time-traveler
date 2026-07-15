import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the entity list-page specs (the list "shell": loading /
 * empty / error / filtered states, the FilterRail, and bulk actions). They
 * cover the two things a list spec keeps needing: driving the shared filter
 * UI, and forcing the query states that a real, non-empty local DB won't
 * produce on cue (loading / hard-error / true-empty) via route interception.
 *
 * The mock helpers target a single PostgREST resource GET (e.g. `events`), so
 * the page's *other* backend reads — the timelines filter dropdown, the auth
 * user lookup — still hit the real server and the page renders normally.
 */

/** Matches the paginated list read: GET `<supabase>/rest/v1/<resource>?…`. */
function resourceRoute(resource: string): RegExp {
  return new RegExp(`/rest/v1/${resource}\\?`);
}

/**
 * Fail every list read for `resource` with a 500, so the list renders its
 * inline error + Retry. Returns an unroute fn — call it before clicking Retry
 * so the refetch reaches the real backend and the list recovers.
 */
export async function mockListError(
  page: Page,
  resource: string,
): Promise<() => Promise<void>> {
  const route = resourceRoute(resource);
  await page.route(route, (r) =>
    r.request().method() === "GET"
      ? r.fulfill({ status: 500, contentType: "application/json", body: "{}" })
      : r.continue(),
  );
  return () => page.unroute(route);
}

/**
 * Return an empty page for `resource`: an empty JSON array plus a zero-total
 * `content-range` header, so supabase-js parses a total of 0 (drives the
 * true-empty state, since no filter is applied). Returns an unroute fn.
 */
export async function mockListEmpty(
  page: Page,
  resource: string,
): Promise<() => Promise<void>> {
  const route = resourceRoute(resource);
  await page.route(route, (r) =>
    r.request().method() === "GET"
      ? r.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": "*/0" },
          body: "[]",
        })
      : r.continue(),
  );
  return () => page.unroute(route);
}

/**
 * Delay every list read for `resource` by `ms` before letting it through, so
 * the transient loading state (skeleton + "Loading…") stays observable long
 * enough to assert. Returns an unroute fn.
 */
export async function mockListLoading(
  page: Page,
  resource: string,
  ms = 2000,
): Promise<() => Promise<void>> {
  const route = resourceRoute(resource);
  await page.route(route, async (r) => {
    if (r.request().method() !== "GET") return r.continue();
    await new Promise((resolve) => setTimeout(resolve, ms));
    await r.continue();
  });
  return () => page.unroute(route);
}

/**
 * Type `text` into a list's search box (role `searchbox`). The list debounces
 * search → URL by 300ms, so callers should await the resulting `?q=` change
 * (e.g. `page.waitForURL`) before asserting.
 */
export async function searchList(page: Page, text: string): Promise<void> {
  await page.getByRole("searchbox").fill(text);
}

/**
 * Toggle a FilterRail checkbox by its group id + option value. The rail renders
 * each checkbox with `id="${groupId}-${value}"` (filter-rail.tsx), e.g.
 * `era-CE`, `type-milestone`, `publication-published`.
 */
export async function toggleFilterCheckbox(
  page: Page,
  groupId: string,
  value: string,
): Promise<void> {
  await page.locator(`#${groupId}-${value}`).click();
}

/** Assert the list header switched to its active-filter variant ("… · filtered"). */
export async function expectFilteredHeader(page: Page): Promise<void> {
  await expect(page.getByText(/·\s*filtered/)).toBeVisible();
}
