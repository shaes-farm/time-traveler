import { expect, test } from "@playwright/test";

/**
 * Reader shell e2e coverage — the persistent public chrome that wraps every
 * route (`app/_components/reader-shell.tsx` composing the `@repo/ui` reader-*
 * primitives).
 *
 * The shell's own doc comment says the placeholder routes exist "so the
 * persistent shell can be verified across navigations" — and that verification
 * is only possible in a real browser. Two things here are unreachable from the
 * Vitest suites in `packages/ui`: the skip-link's real tab order / `focus-
 * visible` behavior, and the focus-moves-to-`h1` effect, which needs actual
 * Next App Router client-side navigation to fire.
 *
 * Everything runs anonymously — the reader gates nothing ([ADR-0030]) and
 * needs no session, no seeded user, and no running Supabase.
 */

/** The three global destinations from `lib/nav.ts`. */
const NAV_ITEMS = [
  { label: "Explore", href: "/explore" },
  { label: "Stories", href: "/stories" },
  { label: "Search", href: "/search" },
] as const;

/**
 * `lib/nav.ts` falls back to the admin dev server when
 * `NEXT_PUBLIC_ADMIN_URL` is unset, which is the local-dev case.
 */
const ADMIN_URL = "http://localhost:3000";

test.describe("persistent chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the nav landmarks and all three destinations", async ({
    page,
  }) => {
    await expect(page.getByRole("banner")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();

    for (const item of NAV_ITEMS) {
      await expect(nav.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }

    // Entity types are reached via contextual cross-links, never global nav.
    await expect(nav.getByRole("link")).toHaveCount(NAV_ITEMS.length);

    await expect(
      page.getByRole("link", { name: "Time Traveler — home" }),
    ).toHaveAttribute("href", "/");
  });

  test("renders the footer with its tagline and links", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(
      "Everything has a history, and every history deserves to be explored.",
    );

    await expect(footer.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    await expect(footer.getByRole("link", { name: "Legal" })).toHaveAttribute(
      "href",
      "/legal",
    );
  });

  test("sign-in deep-links out to the admin auth surface", async ({ page }) => {
    // The reader is anonymous: the single sign-in affordance gates nothing and
    // leaves the app entirely, so it must point at the admin origin.
    for (const link of await page
      .getByRole("link", { name: "Sign in" })
      .all()) {
      await expect(link).toHaveAttribute("href", `${ADMIN_URL}/auth/login`);
    }

    await expect(
      page.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", `${ADMIN_URL}/auth/register`);
  });
});

test.describe("skip link", () => {
  test("is the first focusable element and jumps to the main landmark", async ({
    page,
  }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "Skip to content" });

    // `sr-only` hides the link by clipping it away, not by removing it from
    // the layout — so Playwright still reports it "visible" and its box is
    // non-empty. `clip-path` is what actually changes, so assert on that.
    const clipPath = () =>
      skipLink.evaluate((el) => getComputedStyle(el).clipPath);
    expect(await clipPath()).toBe("inset(50%)");

    // First Tab from a fresh load must land on it (accessibility-spec §2.3).
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    // `focus-visible:not-sr-only` un-clips it into a visible chip.
    expect(await clipPath()).toBe("none");

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("navigation", () => {
  test("marks the current destination with aria-current", async ({ page }) => {
    await page.goto("/explore");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      nav.getByRole("link", { name: "Stories" }),
    ).not.toHaveAttribute("aria-current", "page");

    // On the landing route the brand link carries it instead.
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Time Traveler — home" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("moves focus to the destination h1 on client-side navigation", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });

    // The shell's usePathname() effect focuses the destination heading so
    // keyboard/SR users land on the new content (accessibility-spec §2.2).
    // Only a real App Router transition exercises it — a full page load
    // deliberately does NOT steal focus.
    await nav.getByRole("link", { name: "Stories" }).click();
    await expect(page).toHaveURL(/\/stories$/);
    await expect(
      page.getByRole("heading", { name: "Stories", level: 1 }),
    ).toBeFocused();

    await nav.getByRole("link", { name: "Explore" }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(
      page.getByRole("heading", { name: "Explore", level: 1 }),
    ).toBeFocused();

    // The chrome survived both transitions — the shell never remounted.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("does not steal focus on initial load", async ({ page }) => {
    await page.goto("/explore");
    await expect(
      page.getByRole("heading", { name: "Explore", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Explore", level: 1 }),
    ).not.toBeFocused();
  });
});

test.describe("placeholder routes", () => {
  const PLACEHOLDERS = [
    {
      path: "/explore",
      heading: "Explore",
      copy: "The timeline explorer is coming soon.",
    },
    {
      path: "/stories",
      heading: "Stories",
      copy: "The story browser is coming soon.",
    },
    { path: "/search", heading: "Search", copy: "Search is coming soon." },
  ] as const;

  for (const { path, heading, copy } of PLACEHOLDERS) {
    test(`${path} renders its heading and copy inside the shell`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(copy)).toBeVisible();
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    });
  }
});

test.describe("not found", () => {
  test("renders the 404 inside the shell with a single main landmark", async ({
    page,
  }) => {
    await page.goto("/no-such-route");

    await expect(
      page.getByRole("heading", {
        name: "This page is outside the timeline",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to reader home" }),
    ).toHaveAttribute("href", "/");

    // The chrome still wraps it, and `not-found.tsx` renders content only —
    // the shell owns the one and only `main`.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
  });
});
