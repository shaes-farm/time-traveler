import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TemporalInput } from "./temporal-input";
import type { TemporalData } from "@repo/services/schemas/temporal.js";

function TemporalInputHarness({
  seed = null,
  onChange,
}: {
  seed?: TemporalData | null;
  onChange?: (v: TemporalData | null) => void;
}) {
  const [value, setValue] = useState<TemporalData | null>(seed);
  return (
    <TemporalInput
      label="Date"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

/** Open the era Select dropdown and click the option matching `era`. */
async function pickEra(user: ReturnType<typeof userEvent.setup>, era: string) {
  await user.click(screen.getByRole("combobox", { name: "Era" }));
  const option = await screen.findByRole("option", {
    name: new RegExp(`^${era}`),
  });
  await user.click(option);
}

/** Open the precision Select dropdown and click the option. */
async function pickPrecision(
  user: ReturnType<typeof userEvent.setup>,
  precision: string,
) {
  await user.click(screen.getByRole("combobox", { name: "Precision" }));
  const option = await screen.findByRole("option", {
    name: new RegExp(precision, "i"),
  });
  await user.click(option);
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
    await pickEra(user, "MYA");

    expect(screen.queryByLabelText("Month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Day")).not.toBeInTheDocument();
  });

  it("cancel reverts in-progress edits", async () => {
    const user = userEvent.setup();
    render(
      <TemporalInputHarness
        seed={{ year: 1867, era: "CE", precision: "exact" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /1867 CE/i }));
    const yearInput = screen.getByLabelText("Year");
    await user.clear(yearInput);
    await user.type(yearInput, "1900");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Trigger still reflects the original committed value, not the draft.
    expect(
      screen.getByRole("button", { name: /1867 CE/i }),
    ).toBeInTheDocument();
  });

  it("apply commits the draft to the parent", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TemporalInputHarness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.type(screen.getByLabelText("Year"), "1789");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ year: 1789, era: "CE" }),
      );
    });
  });

  it("apply is disabled when validation fails", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    // No year entered → invalid → Apply disabled.
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
  });

  it("era change from CE to MYA shows a clear notice", async () => {
    const user = userEvent.setup();
    render(
      <TemporalInputHarness
        seed={{
          year: 1867,
          month: 11,
          day: 7,
          era: "CE",
          precision: "exact",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /1867 CE/i }));
    await pickEra(user, "MYA");

    expect(
      screen.getByText(/month, day, and time were cleared for MYA dates/i),
    ).toBeInTheDocument();
  });

  it("rejects non-integer year entry", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    const yearInput = screen.getByLabelText("Year") as HTMLInputElement;
    await user.type(yearInput, "1.5");

    // Integer guard rejects the decimal — input keeps the integer part only.
    expect(yearInput.value).not.toBe("1.5");
  });

  it("surfaces a field-level error when CE year is out of range", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.type(screen.getByLabelText("Year"), "1500000000");

    await waitFor(() => {
      expect(
        screen.getByText(/CE year must be <= 1000000000/i),
      ).toBeInTheDocument();
    });
  });

  it("shows a precision warning when 'exact' is paired with a prehistoric era", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await pickEra(user, "KYA");

    // The era switch lands precision on "exact" still; the warning should appear.
    expect(
      screen.getByText(/exact precision is rarely honest at the KYA scale/i),
    ).toBeInTheDocument();
  });

  it("time-of-day disclosure toggles open/closed", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));

    const summary = screen.getByText(/time of day/i);
    const disclosure = summary.closest("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");

    await user.click(summary);
    expect(disclosure).toHaveAttribute("open");

    // Fields render inside the disclosure either way (HTML <details> only
    // hides content visually); confirm they exist once the section opens.
    expect(screen.getByLabelText("Hour")).toBeInTheDocument();
    expect(screen.getByLabelText("Minute")).toBeInTheDocument();
    expect(screen.getByLabelText("Second")).toBeInTheDocument();
  });

  it("source field updates the model on apply", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TemporalInputHarness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.type(screen.getByLabelText("Year"), "1867");

    // Open the Dating method & source disclosure, then type in Source.
    await user.click(screen.getByText(/dating method & source/i));
    await user.type(screen.getByLabelText("Source"), "Encyclopedia");

    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ source: "Encyclopedia" }),
      );
    });
  });

  it("changing precision via the Select updates the preview", async () => {
    const user = userEvent.setup();
    render(<TemporalInputHarness />);

    await user.click(screen.getByRole("button", { name: /add date/i }));
    await user.type(screen.getByLabelText("Year"), "1867");
    await pickPrecision(user, "circa");

    // Preview row (inside popover) should reflect "circa".
    const popover = screen.getByText("Preview:").closest("div");
    expect(popover).not.toBeNull();
    expect(
      within(popover as HTMLElement).getByText(/circa/i),
    ).toBeInTheDocument();
  });
});
