import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes the switch role and checked state", () => {
    render(<Switch checked onCheckedChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("toggles on click", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles via keyboard", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch checked onCheckedChange={onCheckedChange} />);

    screen.getByRole("switch").focus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("does not toggle when disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Switch checked={false} onCheckedChange={onCheckedChange} disabled />,
    );

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
