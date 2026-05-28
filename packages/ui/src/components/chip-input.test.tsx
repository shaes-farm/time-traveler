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
});
