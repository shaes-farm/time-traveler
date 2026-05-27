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
});
