import { expect, test } from "@playwright/test";
import { waitForEmailLink } from "./support/mailbox";
import { createConfirmedUser } from "./support/supabase-admin";

/**
 * Password reset — full round-trip (the one email flow worth completing).
 *
 * Request the reset, pull the recovery link from Mailpit, follow it to the
 * update-password page, set a new password, and prove it works by signing in
 * with it. This exercises real app logic — the recovery-session handling and
 * the update-password page — not just Supabase's email delivery.
 *
 * Runs in the anonymous `chromium` project with its own isolated account (a
 * password change must not disturb the shared `authenticated` session).
 */
test.describe("password reset", () => {
  test("request → email link → set a new password → sign in with it", async ({
    page,
  }) => {
    const email = `e2e-reset-rt-${Date.now()}@timetraveler.test`;
    const oldPassword = "e2e-Password-OLD-1!";
    const newPassword = "e2e-Password-NEW-2!";
    await createConfirmedUser(email, oldPassword);

    // ── Request the reset ───────────────────────────────────────────────
    await page.goto("/auth/reset-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    // ── Follow the recovery link from the email ─────────────────────────
    const link = await waitForEmailLink(
      email,
      /verify|recover|type=recovery|update-password/i,
    );
    await page.goto(link);

    // ── Set a new password on the update-password page ──────────────────
    await page.waitForURL("**/auth/update-password**");
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL("**/dashboard");

    // ── Prove the new password works: sign out, sign back in with it ────
    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL("**/auth/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard");
  });
});
