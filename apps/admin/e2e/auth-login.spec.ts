import { expect, test } from "@playwright/test";

/**
 * Auth / login-page e2e coverage.
 *
 * These specs need no session and no live Supabase: the login page is a
 * server component that renders the form, and the sign-in Server Action
 * only fires on submit with valid input (which we never do here). The
 * unauthenticated-redirect check works because `getUser()` returns null
 * without a session cookie.
 */

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("renders the sign-in form and its chrome", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Enter your email and password")).toBeVisible();

    // Product chrome from the shared AuthLayout.
    await expect(page.getByText("Time Traveler")).toBeVisible();

    // Fields, addressed by their accessible labels.
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("exposes the auth navigation links", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/auth/reset-password");
    await expect(
      page.getByRole("link", { name: "Sign in with a magic link" }),
    ).toHaveAttribute("href", "/auth/magic-link");
    await expect(page.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/auth/register",
    );
  });

  test("shows client-side validation errors on empty submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    // Still on the login page — no navigation occurred.
    await expect(page).toHaveURL(/\/auth\/login\b/);
  });
});

test.describe("unauthenticated redirects", () => {
  test("root sends anonymous visitors to the login page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login\b/);
    await expect(
      page.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeVisible();
  });

  test("a protected route preserves the intended destination in the redirect", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // The auth gate bounces to login and round-trips the original path so
    // the user lands back on /dashboard after signing in.
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fdashboard/);
  });
});
