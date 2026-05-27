import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TemporalInput } from "./temporal-input";
import type { TemporalData } from "@repo/services/schemas/temporal.js";

function TemporalInputHarness() {
  const [value, setValue] = useState<TemporalData | null>(null);

  return <TemporalInput label="Date" value={value} onChange={setValue} />;
}

describe("TemporalInput", () => {
  it("updates the preview for a CE date", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.type(screen.getByLabelText("Year"), "2024");

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /2024 CE/i }),
      ).toBeInTheDocument(),
    );
  });

  it("hides month and day fields for prehistoric eras", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.selectOptions(screen.getByLabelText("Era"), "MYA");

    expect(screen.queryByLabelText("Month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Day")).not.toBeInTheDocument();
  });
});
