import { expect, test } from "@playwright/test";
import { createConfirmedUser } from "./support/supabase-admin";

/**
 * Auth flows — form submission + resulting state, and sign-out.
 *
 * These run in the anonymous `chromium` project (no shared session): they
 * cover the logged-out → in transitions and manage their own accounts. The
 * register / reset / magic-link cases assert the app's part — the form
 * submits and the correct "check your email" state renders — without chasing
 * the email (that's Supabase's delivery, not our code). The full reset
 * round-trip (email → link → new password) lives in auth-password-reset.spec.
 */

const PASSWORD = "e2e-Password-123!";
const uniqueEmail = (tag: string) =>
  `e2e-${tag}-${Date.now()}@timetraveler.test`;

test.describe("auth flows", () => {
  test("register submits and shows the confirm-email state", async ({
    page,
  }) => {
    await page.goto("/auth/register");
    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Email").fill(uniqueEmail("register"));
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
  });

  test("password-reset request shows the check-email state", async ({
    page,
  }) => {
    await page.goto("/auth/reset-password");
    await page.getByLabel("Email").fill(uniqueEmail("reset"));
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
  });

  test("magic-link request shows the check-email state", async ({ page }) => {
    await page.goto("/auth/magic-link");
    await page.getByLabel("Email").fill(uniqueEmail("magic"));
    await page.getByRole("button", { name: "Send magic link" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
  });

  test("a signed-in user can sign out", async ({ page }) => {
    // Own confirmed account — separate from the shared `authenticated` session.
    const email = uniqueEmail("logout");
    await createConfirmedUser(email, PASSWORD);

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard");

    // Sign out via the shell user menu → back to the login page.
    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL("**/auth/login");
  });
});
