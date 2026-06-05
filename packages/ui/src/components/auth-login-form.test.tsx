import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthLoginForm } from "./auth-login-form";

describe("AuthLoginForm", () => {
  it("shows schema validation errors and blocks submit", async () => {
    const action = vi.fn();
    const user = userEvent.setup();

    render(<AuthLoginForm action={action} />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits valid credentials and displays server errors", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: "Invalid email or password." },
    });
    const user = userEvent.setup();

    render(<AuthLoginForm action={action} initialError="Seeded error" />);

    expect(screen.getByText("Seeded error")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret",
      });
    });
    expect(
      await screen.findByText("Invalid email or password."),
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

    render(<AuthLoginForm action={action} />);

    await user.type(screen.getByLabelText("Email"), "pending@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const submit = screen.getByRole("button", { name: /signing in/i });
    expect(submit).toBeDisabled();

    resolveAction({ ok: false, error: { message: "Later" } });
    await waitFor(() => expect(submit).not.toBeDisabled());
  });
});
