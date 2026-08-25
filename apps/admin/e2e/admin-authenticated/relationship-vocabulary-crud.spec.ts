import { expect, test, type Page } from "@playwright/test";
import {
  cleanupRelationships,
  seedRelationships,
  type RelationshipsFixture,
} from "../support/relationships-fixture";
import { createServiceRoleClient } from "../support/supabase-admin";
import { seedAdminTestUser } from "../support/test-user";

/**
 * The relationship vocabulary manager, end to end (#428).
 *
 * Runs as the seeded **admin** account (`admin-authenticated` project). The
 * editor's side of the gate is asserted in `authenticated/admin-gate.spec.ts`.
 *
 * ## Key naming
 *
 * Vocabulary keys are validated against `^[a-z][a-z0-9_]*$`, so the fixtures use
 * an `e2e_` prefix with an **underscore** — not the `e2e-` used for every
 * content slug. `sweepE2eVocabulary` matches the same prefix.
 *
 * Leftovers here are not cosmetic: `00030_seed_relationship_vocabulary_test.sql`
 * asserts exactly 10 categories / 32 types / 32 roles, so a stranded row turns
 * `pnpm db:test` red later, somewhere that looks unrelated.
 *
 * ## Why reordering only ever touches e2e-created rows
 *
 * A reorder swaps `sort_order` between two adjacent siblings. Swapping an
 * e2e group with a *seeded* one would leave the seeded row's `sort_order`
 * permanently altered after the sweep removed its partner — mutating fixture
 * data that `00030`'s pgTAP suite makes assertions about. So the reorder test
 * creates two groups and swaps them with each other.
 */

const VOCABULARY_URL = "/admin/relationship-vocabulary";

let fixture: RelationshipsFixture;

/**
 * A category + type this file owns outright, plus one relationship using the
 * type, so the in-use delete guard rail has a *deterministic* blast radius.
 *
 * Deliberately not a seeded type such as `friendship`:
 * `authenticated/relationships.spec.ts` creates and deletes friendships
 * concurrently, so the count under `fullyParallel` is whatever happens to be in
 * flight. Owning the vocabulary makes the expected count exactly 1.
 */
let inUse: {
  categoryKey: string;
  categoryLabel: string;
  typeKey: string;
  typeLabel: string;
};

test.beforeAll(async () => {
  const adminUserId = await seedAdminTestUser();
  fixture = await seedRelationships(adminUserId);

  const stamp = fixture.stamp;
  inUse = {
    categoryKey: `e2e_used_grp_${stamp}`,
    categoryLabel: `E2E Used Set ${stamp}`,
    typeKey: `e2e_used_type_${stamp}`,
    typeLabel: `E2E Used Bond ${stamp}`,
  };

  const admin = createServiceRoleClient();

  const { error: categoryError } = await admin
    .from("relationship_categories")
    .insert({
      key: inUse.categoryKey,
      label: inUse.categoryLabel,
      // Well past the seeded 10..100 so it sorts to the end of the tree.
      sort_order: 900,
    });
  if (categoryError) throw categoryError;

  const { error: typeError } = await admin.from("relationship_types").insert({
    key: inUse.typeKey,
    label: inUse.typeLabel,
    category_key: inUse.categoryKey,
    is_symmetric: true,
    symmetric_noun: "e2e used peers",
    sort_order: 10,
  });
  if (typeError) throw typeError;

  // Inserted directly rather than through the UI: this test cares about the
  // FK's RESTRICT behaviour, not about reciprocal-edge creation (which
  // `authenticated/relationships.spec.ts` already covers).
  const { error: relError } = await admin
    .from("character_relationships")
    .insert({
      user_id: adminUserId,
      character_id: fixture.charA.id,
      related_character_id: fixture.charB.id,
      relationship_type: inUse.typeKey,
    });
  if (relError) throw relError;
});

test.afterAll(async () => {
  // Stamp-scoped, never a blanket `e2e_` sweep: `fullyParallel` can split this
  // file across workers, and a prefix-wide sweep from one worker's afterAll
  // would delete rows another worker was still using. The blanket sweep belongs
  // to the `cleanup` teardown project, which runs after every spec has
  // finished, with `admin-auth.setup.ts`'s entry sweep as the backstop for a
  // killed run.
  await cleanupRelationships(fixture);

  const admin = createServiceRoleClient();
  // Types before categories: `relationship_types.category_key` is RESTRICT.
  await admin.from("relationship_types").delete().eq("key", inUse.typeKey);
  await admin
    .from("relationship_categories")
    .delete()
    .eq("key", inUse.categoryKey);
});

test.beforeEach(async ({ page }) => {
  // The TanStack Query Devtools launcher (dev-only) floats in the corner and
  // overlaps the inspector's footer Create/Save buttons, intercepting clicks.
  // Same workaround as category-crud.spec.ts: `addInitScript` rather than
  // `addStyleTag` so it survives every navigation, including the client-side
  // ones the cache-invalidation test depends on.
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

/**
 * `exact: true` throughout: the app shell's topbar carries a "Quick create"
 * button whose accessible name contains "create", so a substring match on
 * "Create" is ambiguous with the inspector's submit button.
 */
const submit = (page: Page, name: "Create" | "Save") =>
  page.getByRole("button", { name, exact: true });

/** Open the header's New menu and pick one of its levels. */
async function newEntry(
  page: Page,
  item: "Group" | "Relationship type" | "Sub-role of the selected type",
): Promise<void> {
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

/**
 * Ensure a tree row is expanded.
 *
 * Checks `aria-expanded` rather than clicking blind: the Tree auto-reveals the
 * selected node by expanding its ancestors, so a row can already be open — in
 * which case its toggle is labelled "Collapse" and clicking it would close the
 * subtree the caller wanted open.
 */
async function ensureExpanded(
  page: Page,
  name: RegExp | string,
): Promise<void> {
  const row = page.getByRole("treeitem", { name });
  await expect(row).toBeVisible();
  if ((await row.getAttribute("aria-expanded")) === "false") {
    await row.getByLabel("Expand").click();
  }
  await expect(row).toHaveAttribute("aria-expanded", "true");
}

/**
 * Select a tree row, then open its overflow menu.
 *
 * Waits for the expected inspector heading in between: selecting a row pushes a
 * new URL, and the inspector is remounted on the new selection. Opening the
 * menu before that settles races the remount, which discards the menu's open
 * state.
 */
async function openActions(
  page: Page,
  label: RegExp | string,
  heading: "Edit group" | "Edit type" | "Edit sub-role",
): Promise<void> {
  await page.getByRole("treeitem", { name: label }).click();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await page.getByRole("button", { name: "More actions" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
}

test.describe("relationship vocabulary CRUD", () => {
  test("creates, reorders, deactivates and deletes across all three levels", async ({
    page,
  }) => {
    const stamp = Date.now();
    // Fixture labels deliberately avoid the words "Group", "Key", "Label" and
    // "Order": the reorder buttons' accessible names embed the row label
    // ("Move <label> up"), so a label containing a field name makes every
    // `getByLabel` in this test ambiguous.
    const groupA = { key: `e2e_grp_a_${stamp}`, label: `E2E Alpha ${stamp}` };
    const groupB = { key: `e2e_grp_b_${stamp}`, label: `E2E Beta ${stamp}` };
    const typeKey = `e2e_type_${stamp}`;
    const typeLabel = `E2E Bond ${stamp}`;
    const roleKey = `e2e_role_${stamp}`;
    const roleLabel = `E2E Part ${stamp}`;

    await page.goto(VOCABULARY_URL);
    await expect(
      page.getByRole("heading", { name: "Relationship vocabulary" }),
    ).toBeVisible();

    // ---- create two groups ---------------------------------------------
    for (const group of [groupA, groupB]) {
      await newEntry(page, "Group");
      await expect(
        page.getByRole("heading", { name: "New group" }),
      ).toBeVisible();
      await page.getByLabel("Key").fill(group.key);
      await page.getByLabel("Label").fill(group.label);
      await submit(page, "Create").click();

      // The tree updates from the invalidated cache, with no reload.
      await expect(
        page.getByRole("treeitem", { name: group.label }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Edit group" }),
      ).toBeVisible();
    }

    // Key is immutable once the row exists (ADR-0041).
    await expect(page.getByLabel("Key")).toBeDisabled();
    await expect(page.getByText(/Keys are permanent/)).toBeVisible();

    // ---- reorder, between the two e2e groups only ----------------------
    // Both were appended, so B is last: it can move up but not down.
    await expect(page.getByLabel(`Move ${groupB.label} down`)).toBeDisabled();
    await page.getByLabel(`Move ${groupB.label} up`).click();
    // After swapping with A, B is no longer last.
    await expect(page.getByLabel(`Move ${groupB.label} down`)).toBeEnabled();
    await expect(page.getByLabel(`Move ${groupA.label} up`)).toBeEnabled();

    // ---- create a type inside group A ----------------------------------
    await page.getByRole("treeitem", { name: groupA.label }).click();
    await newEntry(page, "Relationship type");

    await expect(page.getByRole("heading", { name: "New type" })).toBeVisible();
    await page.getByLabel("Key").fill(typeKey);
    await page.getByLabel("Label").fill(typeLabel);
    // Role-scoped: `getByLabel("Group")` would also match the tree's reorder
    // buttons, whose accessible names embed each row's label.
    await page.getByRole("combobox", { name: "Group" }).click();
    await page.getByRole("option", { name: groupA.label }).click();
    // The default reciprocal mode is symmetric, which requires a noun.
    await page.getByLabel("Noun").fill("e2e peers");
    await submit(page, "Create").click();

    await expect(
      page.getByRole("heading", { name: "Edit type" }),
    ).toBeVisible();

    // ---- create a sub-role ---------------------------------------------
    await newEntry(page, "Sub-role of the selected type");
    await expect(
      page.getByRole("heading", { name: "New sub-role" }),
    ).toBeVisible();
    await page.getByLabel("Key").fill(roleKey);
    await page.getByLabel("Label").fill(roleLabel);
    await submit(page, "Create").click();

    await expect(
      page.getByRole("heading", { name: "Edit sub-role" }),
    ).toBeVisible();

    // The whole chain is now in the tree.
    await ensureExpanded(page, groupA.label);
    await expect(page.getByRole("treeitem", { name: typeLabel })).toBeVisible();

    // ---- deactivate the type -------------------------------------------
    await openActions(page, typeLabel, "Edit type");
    await page.getByRole("menuitem", { name: "Deactivate" }).click();

    const deactivateDialog = page.getByRole("alertdialog");
    await expect(deactivateDialog).toContainText(
      "Existing relationships keep working",
    );
    await deactivateDialog
      .getByRole("button", { name: "Deactivate", exact: true })
      .click();

    await expect(
      page.getByRole("treeitem", { name: typeLabel }).getByText("Inactive"),
    ).toBeVisible();

    // ---- delete, bottom-up ---------------------------------------------
    // Roles first, then the type, then the groups: `relationship_types.category_key`
    // is ON DELETE RESTRICT, so a group cannot go while it still holds a type.
    // The role sits a level below the type, so the type needs opening too —
    // expanding the group only revealed the type itself.
    await ensureExpanded(page, typeLabel);
    await deleteEntry(page, roleLabel, "sub-role", "Edit sub-role");
    await deleteEntry(page, typeLabel, "type", "Edit type");
    await deleteEntry(page, groupA.label, "group", "Edit group");
    await deleteEntry(page, groupB.label, "group", "Edit group");

    await expect(
      page.getByRole("treeitem", { name: groupA.label }),
    ).toBeHidden();
    await expect(
      page.getByRole("treeitem", { name: groupB.label }),
    ).toBeHidden();
  });

  test("a newly added type is selectable in the relationship editor without a reload", async ({
    page,
  }) => {
    // The crown jewel, and the reason ADR-0040 IMP-003 exists: the vocabulary
    // is cached with a 5-minute staleTime and read by every editor. Without
    // invalidation on mutation, an admin adds a type and then cannot select it
    // until a hard reload — reproducing at runtime the exact staleness the
    // reference-data refactor set out to remove.
    //
    // Asserted with a client-side navigation only. A `page.goto` would remount
    // the app and refetch regardless, which would pass whether or not the cache
    // was invalidated — and so would prove nothing.
    const stamp = Date.now();
    const typeKey = `e2e_live_${stamp}`;
    const typeLabel = `E2E Live ${stamp}`;

    // Warm the editor's copy of the vocabulary first. Both surfaces read the
    // same query key family but under different `activeOnly` entries, and a
    // cache that was never populated would refetch on first view regardless —
    // so without this step the assertion below could pass for the wrong reason.
    await page.goto(`/characters/${fixture.charA.slug}`);
    await page.getByRole("tab", { name: /Relationships/ }).click();
    await page
      .getByRole("button", { name: "Add relationship" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Add relationship" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: typeLabel })).toBeHidden();
    await page.keyboard.press("Escape");

    // Client-side navigation to the manager — no full page load from here on.
    await page.getByRole("link", { name: "Relationship vocabulary" }).click();
    await page.waitForURL("**/admin/relationship-vocabulary");
    await expect(page.getByRole("tree")).toBeVisible();

    await newEntry(page, "Relationship type");
    await page.getByLabel("Key").fill(typeKey);
    await page.getByLabel("Label").fill(typeLabel);
    await page.getByLabel("Noun").fill("e2e live peers");
    await submit(page, "Create").click();
    await expect(
      page.getByRole("heading", { name: "Edit type" }),
    ).toBeVisible();

    // Back to the same character by history, which the App Router handles as a
    // soft navigation — the React tree and its QueryClient stay mounted, so the
    // picker below is reading cache, not a fresh page's first fetch.
    //
    // Deliberately not via the Characters list: this session is an admin, and
    // RLS lets an admin read every user's characters, so the fixture is not
    // reliably on the first page.
    await page.goBack();
    await page.waitForURL(`**/characters/${fixture.charA.slug}**`);

    await page.getByRole("tab", { name: /Relationships/ }).click();
    await page
      .getByRole("button", { name: "Add relationship" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Add relationship" }),
    ).toBeVisible();

    // The picker reads the same query key the create mutation invalidated.
    await expect(page.getByRole("radio", { name: typeLabel })).toBeVisible();
  });

  test("refuses to delete a type that is in use and points at deactivation", async ({
    page,
  }) => {
    // `character_relationships.relationship_type` is ON DELETE RESTRICT.
    // beforeAll created a relationship using this type, so the delete must be
    // refused — and refused with a sentence, not a raw 23503.
    await page.goto(VOCABULARY_URL);
    await ensureExpanded(page, inUse.categoryLabel);

    await openActions(page, inUse.typeLabel, "Edit type");
    await page.getByRole("menuitem", { name: "Delete permanently…" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(
      "1 relationship uses this type, so it can’t be deleted",
    );
    await expect(dialog).not.toContainText("23503");
    await expect(dialog).not.toContainText("violates foreign key");

    // Deletion is not offered at all; deactivation is what's on the button.
    await expect(
      dialog.getByRole("button", { name: "Delete permanently" }),
    ).toBeHidden();
    await dialog.getByRole("button", { name: "Deactivate instead" }).click();

    // Handing off to the deactivate dialog is the whole point of the guard rail.
    await expect(page.getByRole("alertdialog")).toContainText(
      "Existing relationships keep working",
    );
  });
});

/** Select a tree row and delete it through the overflow menu. */
async function deleteEntry(
  page: Page,
  label: string,
  noun: string,
  heading: "Edit group" | "Edit type" | "Edit sub-role",
): Promise<void> {
  await openActions(page, label, heading);
  await page.getByRole("menuitem", { name: "Delete permanently…" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText(`Nothing uses this ${noun}`);
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(dialog).toBeHidden();

  // Assert the row is actually gone before returning. This is the real
  // post-condition, and it also lets the tree finish re-rendering after the
  // cache invalidation — a caller that clicked the next row immediately would
  // race that re-render.
  await expect(page.getByRole("treeitem", { name: label })).toBeHidden();
}
