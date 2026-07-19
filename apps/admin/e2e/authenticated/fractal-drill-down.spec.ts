import { expect, test } from "@playwright/test";
import {
  seedFractalTimeline,
  type FractalFixture,
} from "../support/fractal-fixture";
import { seedTestUser } from "../support/test-user";

/**
 * Fractal drill-down (timeline detail → Tree view), the feature added in #296.
 *
 * Runs under the `authenticated` project (starts signed in). A per-suite
 * fixture seeds a parent timeline with one expandable event (drills into a
 * sub-timeline) and one plain event, so the Tree view shows exactly one
 * drill-down marker.
 */
test.describe("fractal drill-down", () => {
  let fx: FractalFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedFractalTimeline(userId);
  });

  test("Tree view marks the expandable event and drills into it", async ({
    page,
  }) => {
    await page.goto(`/timelines/${fx.timelineId}`);

    // The Events tab is the default; with events present, the view toggle shows.
    const viewToggle = page.getByRole("group", { name: "Events view" });
    await expect(viewToggle).toBeVisible();

    // Switch List → Tree.
    const treeButton = viewToggle.getByRole("button", { name: "tree" });
    await treeButton.click();
    await expect(treeButton).toHaveAttribute("aria-pressed", "true");

    const tree = page.getByRole("tree", {
      name: `${fx.timelineTitle} — event tree`,
    });
    await expect(tree).toBeVisible();

    // Exactly one drill-down marker — on the expandable event, not the plain one.
    const marker = { name: "Expands into a sub-timeline" };
    await expect(tree.getByRole("img", marker)).toHaveCount(1);

    const expandableItem = tree.getByRole("treeitem", {
      name: new RegExp(fx.expandableEventTitle),
    });
    const plainItem = tree.getByRole("treeitem", {
      name: new RegExp(fx.plainEventTitle),
    });
    await expect(expandableItem.getByRole("img", marker)).toBeVisible();
    await expect(plainItem.getByRole("img", marker)).toHaveCount(0);

    // Activating the expandable event navigates to its event page.
    await expandableItem.click();
    await page.waitForURL(`**/events/${fx.expandableEventSlug}`);
  });

  test("List view: clicking an event row navigates to its event page (#391)", async ({
    page,
  }) => {
    await page.goto(`/timelines/${fx.timelineId}`);

    // The Events tab defaults to List view — no toggle needed.
    const listButton = page
      .getByRole("group", { name: "Events view" })
      .getByRole("button", { name: "list" });
    await expect(listButton).toHaveAttribute("aria-pressed", "true");

    // Each list row exposes its title as a link to the event detail page.
    const plainRowLink = page.getByRole("link", { name: fx.plainEventTitle });
    await expect(plainRowLink).toBeVisible();
    await plainRowLink.click();
    await page.waitForURL(`**/events/${fx.plainEventSlug}`);
  });
});
