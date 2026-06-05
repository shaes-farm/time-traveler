import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthMagicLinkForm } from "./auth-magic-link-form";

describe("AuthMagicLinkForm", () => {
  it("shows email validation errors", async () => {
    const action = vi.fn();
    const user = userEvent.setup();

    render(<AuthMagicLinkForm action={action} />);

    await user.click(screen.getByRole("button", { name: "Send magic link" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits email and shows success state", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<AuthMagicLinkForm action={action} />);

    await user.type(screen.getByLabelText("Email"), "magic@example.com");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({ email: "magic@example.com" });
    });
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("disables submit while request is pending", async () => {
    let resolveAction: (result: { ok: true }) => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<AuthMagicLinkForm action={action} />);

    await user.type(screen.getByLabelText("Email"), "wait@example.com");
    await user.click(screen.getByRole("button", { name: "Send magic link" }));

    const submit = screen.getByRole("button", { name: /sending link/i });
    expect(submit).toBeDisabled();

    resolveAction({ ok: true });
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });
});
