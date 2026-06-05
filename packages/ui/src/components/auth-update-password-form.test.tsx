import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthUpdatePasswordForm } from "./auth-update-password-form";

describe("AuthUpdatePasswordForm", () => {
  it("validates password confirmation before submit", async () => {
    const action = vi.fn();
    const user = userEvent.setup();

    render(<AuthUpdatePasswordForm action={action} />);

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(screen.getByLabelText("Confirm new password"), "different");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits only password and surfaces server errors", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: "This link has expired." },
    });
    const user = userEvent.setup();

    render(
      <AuthUpdatePasswordForm action={action} initialError="Seeded error" />,
    );

    expect(screen.getByText("Seeded error")).toBeInTheDocument();

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "password123",
    );
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({ password: "password123" });
    });
    expect(
      await screen.findByText("This link has expired."),
    ).toBeInTheDocument();
  });

  it("disables submit while request is pending", async () => {
    let resolveAction: (result: {
      ok: false;
      error: { message: string };
    }) => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<{ ok: false; error: { message: string } }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<AuthUpdatePasswordForm action={action} />);

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "password123",
    );
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    const submit = screen.getByRole("button", { name: /saving/i });
    expect(submit).toBeDisabled();

    resolveAction({ ok: false, error: { message: "Later" } });
    await waitFor(() => expect(submit).not.toBeDisabled());
  });
});
