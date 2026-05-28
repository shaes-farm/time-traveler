import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AutosaveIndicator } from "./autosave-indicator";

describe("AutosaveIndicator", () => {
  it("shows the default label when nothing has been saved yet", () => {
    render(<AutosaveIndicator />);
    expect(screen.getByText("Draft saved")).toBeInTheDocument();
  });

  it("shows the saving state", () => {
    render(<AutosaveIndicator isSaving />);
    expect(screen.getByText("Saving draft...")).toBeInTheDocument();
  });

  it("shows the saved state when savedAt is a Date", () => {
    const savedAt = new Date("2024-01-02T10:15:00.000Z");
    render(<AutosaveIndicator savedAt={savedAt} />);

    expect(screen.getByText(/^Draft saved at /)).toBeInTheDocument();
  });

  it("shows a custom label and formats string dates", () => {
    render(
      <AutosaveIndicator
        className="custom-indicator"
        data-testid="autosave-indicator"
        label="Auto-saved"
        savedAt="2024-01-02T10:15:00.000Z"
      />,
    );

    const indicator = screen.getByTestId("autosave-indicator");
    expect(indicator).toHaveTextContent(/^Auto-saved at /);
    expect(indicator).toHaveClass("custom-indicator");
    expect(indicator).toHaveAttribute("aria-live", "polite");
  });
});
