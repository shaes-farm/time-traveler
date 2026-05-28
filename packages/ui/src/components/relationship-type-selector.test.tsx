import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  RelationshipTypeSelector,
  type RelationshipType,
} from "./relationship-type-selector";

function Harness({
  initialType = "friendship" as RelationshipType,
  initialRole = null as string | null,
  onChange,
}: {
  initialType?: RelationshipType;
  initialRole?: string | null;
  onChange?: (next: { type: RelationshipType; role: string | null }) => void;
}) {
  const [type, setType] = useState<RelationshipType>(initialType);
  const [role, setRole] = useState<string | null>(initialRole);
  return (
    <RelationshipTypeSelector
      type={type}
      role={role}
      onChange={(next) => {
        setType(next.type);
        setRole(next.role);
        onChange?.(next);
      }}
    />
  );
}

describe("RelationshipTypeSelector", () => {
  it("renders all 11 relationship types under their family legends", () => {
    render(<Harness />);

    // Each fieldset legend visible
    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Social / Personal")).toBeInTheDocument();
    expect(screen.getByText("Antagonistic")).toBeInTheDocument();
    expect(screen.getByText("Asymmetric")).toBeInTheDocument();

    // 11 radio items
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(11);
  });

  it("reveals the role Select when a sub-roled type is selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // friendship is initial — no role select yet
    expect(
      screen.queryByTestId("relationship-type-role-select"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("family"));

    expect(
      screen.getByTestId("relationship-type-role-select"),
    ).toBeInTheDocument();
  });

  it("hides the role Select for non-sub-roled types", async () => {
    const user = userEvent.setup();
    render(<Harness initialType="family" initialRole="spouse" />);

    expect(
      screen.getByTestId("relationship-type-role-select"),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("friendship"));

    expect(
      screen.queryByTestId("relationship-type-role-select"),
    ).not.toBeInTheDocument();
  });

  it("clears role when switching from a sub-roled type to a non-sub-roled type", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness initialType="family" initialRole="spouse" onChange={onChange} />,
    );

    await user.click(screen.getByLabelText("friendship"));

    expect(onChange).toHaveBeenCalledWith({
      type: "friendship",
      role: null,
    });
  });

  it("shows family sub-roles in the Select when type is family", async () => {
    const user = userEvent.setup();
    render(<Harness initialType="family" />);

    await user.click(screen.getByRole("combobox", { name: "Role" }));

    expect(
      await screen.findByRole("option", { name: "spouse" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "parent" })).toBeInTheDocument();
  });

  it("shows professional sub-roles in the Select when type is professional", async () => {
    const user = userEvent.setup();
    render(<Harness initialType="professional" />);

    await user.click(screen.getByRole("combobox", { name: "Role" }));

    expect(
      await screen.findByRole("option", { name: "employer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "employee" }),
    ).toBeInTheDocument();
  });
});
