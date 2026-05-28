import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChipInput } from "./chip-input";

function ChipInputHarness() {
  const [chips, setChips] = useState(["alpha"]);

  return <ChipInput label="Tags" value={chips} onChange={setChips} />;
}

describe("ChipInput", () => {
  it("adds chips with Enter and removes the last chip with Backspace", async () => {
    const user = userEvent.setup();
    render(<ChipInputHarness />);

    const input = screen.getByLabelText("Tags");
    await user.type(input, "beta{Enter}");
    expect(screen.getByText("beta")).toBeInTheDocument();

    await user.keyboard("{Backspace}");
    expect(screen.queryByText("beta")).not.toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });

  it("removes a chip from the chip action button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput label="Tags" value={["alpha", "beta"]} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Remove beta" }));
    expect(onChange).toHaveBeenCalledWith(["alpha"]);
  });

  it("adds comma-separated chips on paste and skips duplicates", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChipInput label="Tags" value={["alpha"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Tags"));
    await user.paste("beta, gamma, alpha");

    expect(onChange).toHaveBeenCalledWith(["alpha", "beta", "gamma"]);
  });

  it("ignores paste without commas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChipInput label="Tags" value={["alpha"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Tags"));
    await user.paste("beta");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects onPaste default prevention", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput
        label="Tags"
        value={["alpha"]}
        onChange={onChange}
        onPaste={(event) => event.preventDefault()}
      />,
    );

    await user.click(screen.getByLabelText("Tags"));
    await user.paste("beta, gamma");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not commit blank chips on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChipInput label="Tags" value={["alpha"]} onChange={onChange} />);

    const input = screen.getByLabelText("Tags");
    await user.type(input, "   {Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects onKeyDown default prevention", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChipInput
        label="Tags"
        value={["alpha"]}
        onChange={onChange}
        onKeyDown={(event) => event.preventDefault()}
      />,
    );

    const input = screen.getByLabelText("Tags");
    await user.type(input, "beta{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies disabled styling and description linkage", () => {
    render(
      <ChipInput
        label="Tags"
        value={[]}
        onChange={() => {}}
        disabled
        description="Comma-separated tags"
      />,
    );

    const input = screen.getByLabelText("Tags");
    expect(input).toHaveClass("cursor-not-allowed");
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("description"),
    );
    expect(screen.getByText("Comma-separated tags")).toBeInTheDocument();
  });

  it("does not emit removal when sparse chip arrays resolve to undefined", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sparseValue = Array(1) as unknown as string[];

    render(<ChipInput label="Tags" value={sparseValue} onChange={onChange} />);

    const input = screen.getByLabelText("Tags");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(onChange).not.toHaveBeenCalled();
  });
});
