import { expect, test } from "@playwright/test";

/**
 * Landing-page e2e coverage (`app/page.tsx` and the six sections under
 * `app/_components/landing/`).
 *
 * Scope is deliberately integration-level: that each section is composed onto
 * the page, that the CTAs route where they claim, and that the two interactive
 * behaviors work in a real browser — the FAQ's native `<details>` disclosure
 * (no JS at all) and the era strip's log/linear toggle. The strip's scale math
 * (`computeMarkerLeft` / `computeLogBands`) is already unit-tested in
 * `packages/ui/src/components/era-timeline-strip.test.tsx` and is not
 * re-asserted here.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("hero", () => {
  test("renders the headline, kicker, and both CTAs", async ({ page }) => {
    await expect(page).toHaveTitle("Time Traveler Reader");

    await expect(
      page.getByRole("heading", {
        name: "Everything has a history.",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("13.8 billion years · one landscape"),
    ).toBeVisible();

    // Both CTA labels appear twice — once in the hero, once in "Get started".
    await expect(
      page.getByRole("link", { name: "Explore timelines" }),
    ).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Read stories" })).toHaveCount(
      2,
    );
  });
});

test.describe("sections", () => {
  const HEADINGS = [
    "How it works",
    "Every question reveals a different landscape",
    "Come find it. Come make it visible.",
    "Questions",
  ] as const;

  for (const name of HEADINGS) {
    test(`renders the "${name}" section`, async ({ page }) => {
      await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
    });
  }

  test("renders the four feature and persona cards", async ({ page }) => {
    for (const title of [
      "Everything connects",
      "Hybrid time",
      "Honest about doubt",
      "History is made twice",
    ]) {
      await expect(
        page.getByRole("heading", { name: title, level: 3 }),
      ).toBeVisible();
    }

    for (const persona of [
      "Educators",
      "Researchers",
      "Storytellers",
      "The curious",
    ]) {
      await expect(page.getByText(persona, { exact: true })).toBeVisible();
    }
  });
});

test.describe("call-to-action routing", () => {
  test("the hero CTAs route into the two reader spines", async ({ page }) => {
    await page.getByRole("link", { name: "Explore timelines" }).first().click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(
      page.getByRole("heading", { name: "Explore", level: 1 }),
    ).toBeVisible();

    await page.goBack();
    await page.getByRole("link", { name: "Read stories" }).first().click();
    await expect(page).toHaveURL(/\/stories$/);
    await expect(
      page.getByRole("heading", { name: "Stories", level: 1 }),
    ).toBeVisible();
  });
});

test.describe("FAQ", () => {
  const QUESTION = "How far back does it go?";

  test("expands an answer on click", async ({ page }) => {
    // Native <details>/<summary> — no JS, so this is real-browser-only.
    // The summary carries a decorative "+" glyph alongside the question, so
    // scope to the <details> by text rather than matching the label exactly.
    const item = page.locator("details").filter({ hasText: QUESTION });
    const summary = item.locator("summary");
    const answer = item.locator("p");

    await expect(answer).not.toBeVisible();

    await summary.click();
    await expect(answer).toBeVisible();
    await expect(answer).toContainText("To the first second of the universe.");

    await summary.click();
    await expect(answer).not.toBeVisible();
  });
});

test.describe("era timeline strip", () => {
  const LOG_CAPTION = /Logarithmic scale — each step is 10× deeper in time\./;
  const LINEAR_CAPTION = /On a linear scale, 13\.8 billion years crushes/;

  test("defaults to the logarithmic scale with era bands", async ({ page }) => {
    const group = page.getByRole("group", { name: "Timeline scale" });
    await expect(group).toBeVisible();

    await expect(
      group.getByRole("button", { name: "Logarithmic" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(group.getByRole("button", { name: "Linear" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await expect(page.getByTestId("era-bands")).toBeVisible();
    await expect(page.getByText(LOG_CAPTION)).toBeVisible();

    // Era hues always travel with their mono era-code text, never color
    // alone (accessibility-spec §6) — the codes must be in the DOM.
    for (const marker of ["Big Bang", "Earth forms", "Today"]) {
      await expect(page.getByText(marker, { exact: true })).toBeVisible();
    }
  });

  test("switching to linear flips the toggle, drops the bands, and swaps the caption", async ({
    page,
  }) => {
    const group = page.getByRole("group", { name: "Timeline scale" });

    await group.getByRole("button", { name: "Linear" }).click();

    await expect(group.getByRole("button", { name: "Linear" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      group.getByRole("button", { name: "Logarithmic" }),
    ).toHaveAttribute("aria-pressed", "false");

    // Bands are log-only — they describe powers of ten.
    await expect(page.getByTestId("era-bands")).toHaveCount(0);

    // The caption lives in an aria-live region so the change is announced.
    await expect(page.getByText(LINEAR_CAPTION)).toBeVisible();
    await expect(page.getByText(LOG_CAPTION)).toHaveCount(0);

    // ...and back again.
    await group.getByRole("button", { name: "Logarithmic" }).click();
    await expect(page.getByTestId("era-bands")).toBeVisible();
    await expect(page.getByText(LOG_CAPTION)).toBeVisible();
  });

  test("the toggle is reachable and operable by keyboard", async ({ page }) => {
    const linear = page
      .getByRole("group", { name: "Timeline scale" })
      .getByRole("button", { name: "Linear" });

    await linear.focus();
    await expect(linear).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(linear).toHaveAttribute("aria-pressed", "true");
  });
});
