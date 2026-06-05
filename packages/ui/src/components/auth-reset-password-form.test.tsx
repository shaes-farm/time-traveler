import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthResetPasswordForm } from "./auth-reset-password-form";

describe("AuthResetPasswordForm", () => {
  it("shows email validation errors", async () => {
    const action = vi.fn();
    const user = userEvent.setup();

    render(<AuthResetPasswordForm action={action} />);

    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits email and renders server error responses", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: "Unable to send reset email." },
    });
    const user = userEvent.setup();

    render(
      <AuthResetPasswordForm
        action={action}
        initialError="Seeded reset error"
      />,
    );

    expect(screen.getByText("Seeded reset error")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "reset@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({ email: "reset@example.com" });
    });
    expect(
      await screen.findByText("Unable to send reset email."),
    ).toBeInTheDocument();
  });

  it("renders initialSuccess immediately", () => {
    const action = vi.fn();
    render(<AuthResetPasswordForm action={action} initialSuccess />);
    expect(screen.getByText("Check your email")).toBeInTheDocument();
  });
});
