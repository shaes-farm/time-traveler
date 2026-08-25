import { describe, expect, it } from "vitest";

import { ADMIN_NAV_ITEMS, NAV_ITEMS, navItemsForRole } from "./nav";

const labels = (entries: ReturnType<typeof navItemsForRole>): string[] =>
  entries.map((entry) => entry.label);

describe("navItemsForRole", () => {
  it("gives an editor the base nav, unchanged", () => {
    expect(navItemsForRole("editor")).toEqual(NAV_ITEMS);
  });

  it("appends the administration group for an admin", () => {
    const admin = navItemsForRole("admin");
    expect(labels(admin)).toEqual([...labels(NAV_ITEMS), "Administration"]);
  });

  it("does not expose any admin route to an editor", () => {
    // The gate is `proxy.ts` plus the route's layout; this only checks that the
    // sidebar doesn't advertise a destination the user will bounce off.
    const editorHrefs = JSON.stringify(navItemsForRole("editor"));
    expect(editorHrefs).not.toContain("/admin/");
  });

  it("points the vocabulary entry at a URL the proxy's /admin prefix matches", () => {
    // Next route groups don't appear in URLs, so the gate keys on the literal
    // prefix. An entry that lost the segment would silently become ungated.
    const group = ADMIN_NAV_ITEMS[0];
    const items = group && "items" in group ? group.items : [];
    expect(items.map((item) => item.href)).toEqual([
      "/admin/relationship-vocabulary",
    ]);
    for (const item of items) {
      expect(item.href.startsWith("/admin/")).toBe(true);
    }
  });

  it("does not mutate the shared base array", () => {
    const before = NAV_ITEMS.length;
    navItemsForRole("admin");
    navItemsForRole("admin");
    expect(NAV_ITEMS.length).toBe(before);
  });
});
