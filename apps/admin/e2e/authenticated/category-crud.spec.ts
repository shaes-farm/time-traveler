import { expect, test, type Locator, type Page } from "@playwright/test";
import { saveForm } from "../support/crud-helpers";

/**
 * Category CRUD spine — drives the tree + inspector manager end to end.
 *
 * Categories diverge from the other entities on purpose (wireframe 24): a
 * single two-pane surface (tree on the left, an inline create/edit inspector
 * on the right) instead of list/detail/edit routes. Since the M-2026 refactor
 * the inspector is URL-addressable via nested routes — `/categories/new` and
 * `/categories/<id>` — which these specs exercise directly (deep-link edit,
 * not-found), alongside the create → view → edit → delete journey and the
 * hierarchy-only reparent-on-delete policy.
 *
 * Self-cleaning: every category created here is deleted before the test ends.
 * Runs under the `authenticated` project (starts signed in).
 */

const TITLE_PLACEHOLDER = "e.g. Quantum Mechanics";

async function fillTitleAndSave(page: Page, title: string): Promise<void> {
  await page.getByPlaceholder(TITLE_PLACEHOLDER).fill(title);
  await saveForm(page);
}

/**
 * After a create/redirect, assert we've landed on the `/categories/<uuid>`
 * edit route with the inspector hydrated, and return the id from the URL.
 */
async function expectEditRouteAndReadId(
  page: Page,
  title: string,
): Promise<string> {
  await expect(page).toHaveURL(/\/categories\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Edit category" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder(TITLE_PLACEHOLDER)).toHaveValue(title);
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

/** The tree row for a category, matched by its (unique, timestamped) title. */
function treeItem(page: Page, title: string): Locator {
  return page.getByRole("treeitem").filter({ hasText: title });
}

/**
 * Open the delete confirmation from the edit inspector. Before the dialog
 * exists the footer "Delete" is the only such button; return the alertdialog
 * so callers scope the (differently-labelled) confirm button inside it.
 */
async function openDeleteDialog(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("category CRUD spine", () => {
  test.beforeEach(async ({ page }) => {
    // The TanStack Query Devtools launcher (dev-only) floats in the corner and
    // overlaps the inspector's footer Save/Delete buttons, intercepting clicks.
    // Hide it so clicks land on the real controls. No effect on a production
    // build, where the devtools are not rendered at all. addInitScript re-runs
    // on every navigation, so it survives the goto()s below.
    await page.addInitScript(() => {
      const inject = () => {
        if (document.getElementById("e2e-hide-tsqd")) return;
        const style = document.createElement("style");
        style.id = "e2e-hide-tsqd";
        style.textContent = ".tsqd-parent-container{display:none !important;}";
        (document.head ?? document.documentElement).appendChild(style);
      };
      // At document_start the <head> may not exist yet; retry once it does.
      if (document.head) inject();
      else document.addEventListener("DOMContentLoaded", inject);
    });
  });

  test("create, view via the tree, edit, then delete a category", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `E2E Category ${stamp}`;
    const editedTitle = `${title} (edited)`;

    // ── Create (root) ───────────────────────────────────────────────────
    await page.goto("/categories/new");
    await expect(
      page.getByRole("heading", { level: 2, name: "New category" }),
    ).toBeVisible();
    await fillTitleAndSave(page, title);
    const id = await expectEditRouteAndReadId(page, title);

    // ── View via the tree ───────────────────────────────────────────────
    // Land on the manager (empty inspector), then select the node from the
    // persistent tree and confirm it routes to its edit URL.
    await page.goto("/categories");
    await expect(
      page.getByText("Select a category to edit, or create a new one."),
    ).toBeVisible();
    await treeItem(page, title).click();
    await expect(page).toHaveURL(new RegExp(`/categories/${id}$`));
    await expect(
      page.getByRole("heading", { level: 2, name: "Edit category" }),
    ).toBeVisible();

    // ── Edit ────────────────────────────────────────────────────────────
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill(editedTitle);
    await saveForm(page);
    // Stays on the same route; the tree reflects the new title.
    await expect(page).toHaveURL(new RegExp(`/categories/${id}$`));
    await expect(treeItem(page, editedTitle)).toBeVisible();

    // ── Delete (leaf → single confirm) ──────────────────────────────────
    const dialog = await openDeleteDialog(page);
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForURL("**/categories");
    await expect(treeItem(page, editedTitle)).toHaveCount(0);
  });

  test("nests a child and applies the reparent-on-delete policy", async ({
    page,
  }) => {
    const stamp = Date.now();
    const parentTitle = `E2E Parent ${stamp}`;
    const childTitle = `E2E Child ${stamp}`;

    // ── Create the parent (root) ────────────────────────────────────────
    await page.goto("/categories/new");
    await fillTitleAndSave(page, parentTitle);
    const parentId = await expectEditRouteAndReadId(page, parentTitle);

    // ── Create the child, seeded under the parent via ?parent= ──────────
    await page.goto(`/categories/new?parent=${parentId}`);
    await fillTitleAndSave(page, childTitle);
    const childId = await expectEditRouteAndReadId(page, childTitle);
    expect(childId).not.toBe(parentId);

    // The new child is revealed under its (now-expandable) parent and
    // highlighted — the parent auto-expands so the child isn't left hidden.
    await expect(treeItem(page, childTitle)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(treeItem(page, parentTitle)).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ── Delete the parent → hierarchy policy dialog ─────────────────────
    // A node with children offers reparent vs. subtree-cascade (wireframe 24
    // #6); "descendant" in the copy confirms the child was actually nested.
    await page.goto(`/categories/${parentId}`);
    const dialog = await openDeleteDialog(page);
    await expect(dialog).toContainText("descendant");
    await expect(
      dialog.getByRole("button", { name: "Delete subtree" }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Reparent children first" })
      .click();

    // Parent gone; child preserved (reparented to root).
    await page.waitForURL("**/categories");
    await expect(treeItem(page, parentTitle)).toHaveCount(0);
    await expect(treeItem(page, childTitle)).toBeVisible();

    // ── Clean up the reparented child (now a leaf) ──────────────────────
    await treeItem(page, childTitle).click();
    await expect(page).toHaveURL(new RegExp(`/categories/${childId}$`));
    const childDialog = await openDeleteDialog(page);
    await childDialog
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.waitForURL("**/categories");
    await expect(treeItem(page, childTitle)).toHaveCount(0);
  });

  test("edit is deep-linkable and an unknown id shows a not-found notice", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `E2E Deeplink ${stamp}`;

    await page.goto("/categories/new");
    await fillTitleAndSave(page, title);
    const id = await expectEditRouteAndReadId(page, title);

    // ── Deep-link straight to the edit URL (fresh navigation) ───────────
    await page.goto(`/categories/${id}`);
    await expect(
      page.getByRole("heading", { level: 2, name: "Edit category" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(TITLE_PLACEHOLDER)).toHaveValue(title);

    // ── Unknown id → not-found notice with a way back ───────────────────
    await page.goto("/categories/00000000-0000-0000-0000-000000000000");
    await expect(
      page.getByText("That category no longer exists."),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to categories" }).click();
    await expect(page).toHaveURL(/\/categories$/);
    await expect(
      page.getByText("Select a category to edit, or create a new one."),
    ).toBeVisible();

    // ── Clean up ────────────────────────────────────────────────────────
    await page.goto(`/categories/${id}`);
    const dialog = await openDeleteDialog(page);
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForURL("**/categories");
    await expect(treeItem(page, title)).toHaveCount(0);
  });

  test("warns before losing unsaved edits when navigating in the manager", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `E2E Guard ${stamp}`;

    // Create a category, then land on its edit route and make an unsaved edit.
    await page.goto("/categories/new");
    await fillTitleAndSave(page, title);
    await expectEditRouteAndReadId(page, title);
    await page.getByPlaceholder(TITLE_PLACEHOLDER).fill(`${title} UNSAVED`);

    // Shell-driven navigation (New category) is intercepted while dirty.
    await page.getByRole("button", { name: "New category" }).click();
    const confirm = page.getByRole("dialog", {
      name: "Discard unsaved changes?",
    });
    await expect(confirm).toBeVisible();

    // Keep editing → dialog closes, the in-progress edit is preserved.
    await confirm.getByRole("button", { name: "Keep editing" }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByPlaceholder(TITLE_PLACEHOLDER)).toHaveValue(
      `${title} UNSAVED`,
    );

    // Retry and Discard → navigation proceeds.
    await page.getByRole("button", { name: "New category" }).click();
    await page
      .getByRole("dialog", { name: "Discard unsaved changes?" })
      .getByRole("button", { name: "Discard" })
      .click();
    await expect(page).toHaveURL(/\/categories\/new$/);

    // Clean up: the edit was discarded, so the node keeps its saved title.
    await page.goto("/categories");
    await treeItem(page, title).click();
    const del = await openDeleteDialog(page);
    await del.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForURL("**/categories");
    await expect(treeItem(page, title)).toHaveCount(0);
  });
});
