import { expect, test, type Page } from "@playwright/test";
import { seedTestUser } from "../support/test-user";
import {
  cleanupRelationships,
  countRelationships,
  seedRelationships,
  type RelationshipsFixture,
} from "../support/relationships-fixture";
import { mockListError, mockListLoading } from "../support/list-helpers";

/**
 * Character relationships editor — the highest-value surface the CRUD spines
 * never touched (#355). Unlike the list-shell specs, this drives a rich CRUD
 * interaction (Add-relationship Sheet + RelationshipCard menu + Delete dialog),
 * so it follows the CRUD-spine pattern (character-crud.spec.ts), not the
 * list-shell one.
 *
 * The crown-jewel behavior: relationship creation auto-creates a REVERSE entry
 * on the OTHER character, and delete removes BOTH. That logic lives in the
 * SERVICE layer (`createRelationship` / `deleteRelationship`), not a DB trigger,
 * so it only runs when the flow is driven through the UI — which is exactly what
 * the first test does. It asserts the reverse both ways: on the other
 * character's own Relationships tab (the reader surface) AND directly against
 * the DB row count (the invariant: 2 rows after create, 0 after delete).
 *
 * KNOWN BUG #386 (asserted around, not fixed here): the tab renders each
 * reciprocal edge as TWO unmarked cards — `getRelationships` still OR-queries
 * both directed columns (ADR-0008) while the service now also double-stores the
 * reverse row (#119), so a single friendship yields two identical cards and two
 * identical `⋯` menus on the focal tab. The DB row-count invariant is the
 * source of truth for the reverse behavior; the card assertions use `.first()`
 * so the spec stays green while #386 tracks the display defect.
 *
 * A per-suite, self-cleaning fixture seeds two characters owned by the test
 * user; it deliberately seeds NO relationships (a raw service-role insert would
 * bypass the reverse-entry logic). Serial so the fixture seeds/tears down once
 * and the loading/error mocks never race the create/delete journey.
 *
 * Runs under the `authenticated` project (starts signed in).
 */
test.describe.configure({ mode: "serial" });

test.describe("character relationships editor", () => {
  let fx: RelationshipsFixture;

  test.beforeAll(async () => {
    const userId = await seedTestUser();
    fx = await seedRelationships(userId);
  });

  test.afterAll(async () => {
    if (fx) {
      await cleanupRelationships(fx);
    }
  });

  test.beforeEach(async ({ page }) => {
    // The TanStack Query Devtools launcher (dev-only) floats in the corner and
    // can overlap the Sheet/Dialog footer Save/Delete buttons, intercepting
    // clicks. Hide it so clicks land on the real controls. No effect on a
    // production build. addInitScript re-runs on every navigation.
    await page.addInitScript(() => {
      const inject = () => {
        if (document.getElementById("e2e-hide-tsqd")) return;
        const style = document.createElement("style");
        style.id = "e2e-hide-tsqd";
        style.textContent = ".tsqd-parent-container{display:none !important;}";
        (document.head ?? document.documentElement).appendChild(style);
      };
      if (document.head) inject();
      else document.addEventListener("DOMContentLoaded", inject);
    });
  });

  /** Open a character's detail page and switch to its Relationships tab. */
  async function gotoRelationships(page: Page, slug: string): Promise<void> {
    await page.goto(`/characters/${slug}`);
    await page.getByRole("tab", { name: /Relationships/ }).click();
  }

  test("adds a friendship, mirrors it as a reverse entry, then deletes both", async ({
    page,
  }) => {
    // ── Empty state ─────────────────────────────────────────────────────
    await gotoRelationships(page, fx.charA.slug);
    await expect(page.getByText("No relationships yet.")).toBeVisible();

    // ── Add: create a friendship from Alpha → Beta through the sheet ─────
    await page
      .getByRole("button", { name: "Add relationship" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Add relationship" }),
    ).toBeVisible();

    // Pick Beta in the other-character combobox (Alpha is auto-excluded, so a
    // stamp search resolves to Beta alone).
    await page.getByRole("combobox").click();
    await page.getByPlaceholder("Search characters…").fill(String(fx.stamp));
    await page.getByRole("option", { name: fx.charB.name }).click();

    // Friendship: a symmetric, type-only relationship — the reverse swaps the
    // characters and carries the type (no sub-role).
    await page.getByRole("radio", { name: "Friendship" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // The relationship shows on Alpha's tab, naming Beta + a friendship badge.
    // `.first()` throughout: bug #386 renders the reciprocal edge as a duplicate
    // card, and the exact name matches only the identity span (not the "… are
    // friends" direction narrative, which also contains the name).
    await expect(page.getByTestId("relationship-card").first()).toBeVisible();
    await expect(
      page.getByText(fx.charB.name, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("friendship", { exact: true }).first(),
    ).toBeVisible();

    // Invariant: the UI create wrote BOTH the primary and its reverse.
    expect(await countRelationships(fx)).toBe(2);

    // ── Reverse: the mirror entry appears on Beta's own tab ─────────────
    await gotoRelationships(page, fx.charB.slug);
    await expect(page.getByTestId("relationship-card").first()).toBeVisible();
    await expect(
      page.getByText(fx.charA.name, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("friendship", { exact: true }).first(),
    ).toBeVisible();

    // ── Edit: change the description on Alpha's side; it persists ────────
    await gotoRelationships(page, fx.charA.slug);
    const description = `E2E close allies ${fx.stamp}`;
    // `.first()`: two identical action menus exist per bug #386.
    const actionsButton = page
      .getByRole("button", {
        name: `Actions for relationship with ${fx.charB.name}`,
      })
      .first();
    await actionsButton.click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit relationship" }),
    ).toBeVisible();
    // In edit mode the other character is fixed text, not the combobox.
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await page.locator("#rel-description").fill(description);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(description)).toBeVisible();

    // Persisted across a reload.
    await gotoRelationships(page, fx.charA.slug);
    await expect(page.getByText(description)).toBeVisible();

    // ── Delete: removes the entry on BOTH characters ────────────────────
    await page
      .getByRole("button", {
        name: `Actions for relationship with ${fx.charB.name}`,
      })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete relationship?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.getByText("No relationships yet.")).toBeVisible();

    // Invariant: delete removed the primary AND the reverse.
    expect(await countRelationships(fx)).toBe(0);

    // And the reverse is gone from Beta's tab too.
    await gotoRelationships(page, fx.charB.slug);
    await expect(page.getByText("No relationships yet.")).toBeVisible();
  });

  test("loading: the tab shows skeletons while relationships are in flight", async ({
    page,
  }) => {
    const unroute = await mockListLoading(
      page,
      "character_relationships",
      3000,
    );
    await gotoRelationships(page, fx.charA.slug);

    // The tab renders skeleton placeholders (animate-pulse) while the read is
    // delayed; scope to the active tabpanel so the page's own load skeletons
    // can't satisfy it.
    await expect(
      page.getByRole("tabpanel").locator(".animate-pulse").first(),
    ).toBeVisible();

    await unroute();
  });

  test("error: a failed load shows the inline error and Retry recovers", async ({
    page,
  }) => {
    const unroute = await mockListError(page, "character_relationships");
    await gotoRelationships(page, fx.charA.slug);

    // Target the error alert by its text — Next's route announcer is also
    // role="alert", so a bare getByRole("alert") is ambiguous.
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Failed to load relationships." });
    await expect(errorAlert).toBeVisible();

    // Drop the mock, then Retry refetches against the real backend and recovers
    // to the (now-empty) state.
    await unroute();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Failed to load relationships.")).toBeHidden();
  });
});
