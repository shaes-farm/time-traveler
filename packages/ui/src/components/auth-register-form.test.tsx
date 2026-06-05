import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthRegisterForm } from "./auth-register-form";

describe("AuthRegisterForm", () => {
  it("validates password confirmation before submit", async () => {
    const action = vi.fn();
    const user = userEvent.setup();

    render(<AuthRegisterForm action={action} />);

    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.type(screen.getByLabelText("Last name"), "Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits with expected payload and renders success state", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<AuthRegisterForm action={action} />);

    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.type(screen.getByLabelText("Last name"), "Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        password: "password123",
      });
    });

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("renders initialSuccess immediately", () => {
    const action = vi.fn();
    render(<AuthRegisterForm action={action} initialSuccess />);
    expect(screen.getByText("Check your email")).toBeInTheDocument();
  });
});
