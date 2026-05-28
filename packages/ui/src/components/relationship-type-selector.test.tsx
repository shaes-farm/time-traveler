import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  RelationshipTypeSelector,
  type RelationshipType,
} from "./relationship-type-selector";

type SelectorChange = {
  type: RelationshipType;
  role: string | null;
};

function Harness({
  initialType = "friendship" as RelationshipType,
  initialRole = null as string | null,
  onChange,
}: {
  initialType?: RelationshipType;
  initialRole?: string | null;
  onChange?: (next: SelectorChange) => void;
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
  // ─── Type radios ────────────────────────────────────────────────────────────

  it("renders 11 type radios total (one per relationship_type)", () => {
    render(<Harness />);

    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Social / Personal")).toBeInTheDocument();
    expect(screen.getByText("Antagonistic")).toBeInTheDocument();
    expect(screen.getByText("Asymmetric")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(11);
  });

  it("renders one radio per asymmetric type (5 rows in the Asymmetric fieldset)", () => {
    render(<Harness />);
    const fieldset = screen.getByTestId("relationship-type-family-asymmetric");
    const radios = within(fieldset).getAllByRole("radio");
    expect(radios).toHaveLength(5);
  });

  // ─── Sub-role radio group ──────────────────────────────────────────────────

  it("reveals the role radio group when a sub-roled type is selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(
      screen.queryByTestId("relationship-type-role-select"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("family"));

    expect(
      screen.getByTestId("relationship-type-role-select"),
    ).toBeInTheDocument();
  });

  it("hides the role radio group for non-sub-roled types", async () => {
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

  it("renders all family sub-role radios when type is family", () => {
    render(<Harness initialType="family" />);
    const group = screen.getByTestId("relationship-type-role-select");
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(16);
    expect(within(group).getByLabelText("spouse")).toBeInTheDocument();
    expect(within(group).getByLabelText("parent")).toBeInTheDocument();
    expect(within(group).getByLabelText("step parent")).toBeInTheDocument();
  });

  it("renders all professional sub-role radios when type is professional", () => {
    render(<Harness initialType="professional" />);
    const group = screen.getByTestId("relationship-type-role-select");
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(9);
    expect(within(group).getByLabelText("employer")).toBeInTheDocument();
    expect(within(group).getByLabelText("employee")).toBeInTheDocument();
  });

  it("updates role when selecting a sub-role radio", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initialType="family" onChange={onChange} />);

    const group = screen.getByTestId("relationship-type-role-select");
    await user.click(within(group).getByLabelText("spouse"));

    expect(onChange).toHaveBeenCalledWith({
      type: "family",
      role: "spouse",
    });
  });

  it("renders the sub-role group inline inside the selected type's fieldset", () => {
    render(<Harness initialType="family" initialRole="spouse" />);
    const familyFieldset = screen.getByTestId(
      "relationship-type-family-family",
    );
    expect(
      within(familyFieldset).getByTestId("relationship-type-role-select"),
    ).toBeInTheDocument();
  });

  it("places the sub-role group inside the Professional fieldset when collaboration is selected", () => {
    render(
      <Harness initialType="collaboration" initialRole="research_partner" />,
    );
    const professionalFieldset = screen.getByTestId(
      "relationship-type-family-professional",
    );
    expect(
      within(professionalFieldset).getByTestId("relationship-type-role-select"),
    ).toBeInTheDocument();
  });

  // ─── Role carry/clear logic ────────────────────────────────────────────────

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

  it("preserves role across sub-roled types when the value is valid in both", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialType="professional"
        initialRole="other"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("family"));

    expect(onChange).toHaveBeenCalledWith({
      type: "family",
      role: "other",
    });
  });

  it("clears role when the current value is not valid for the next sub-roled type", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness initialType="family" initialRole="spouse" onChange={onChange} />,
    );

    await user.click(screen.getByLabelText("professional"));

    expect(onChange).toHaveBeenCalledWith({
      type: "professional",
      role: null,
    });
  });

  // ─── Helper text ───────────────────────────────────────────────────────────

  it("shows the symmetric helper text for non-asymmetric types", () => {
    render(<Harness initialType="friendship" />);
    expect(
      screen.getByText(/a reverse entry will be created automatically/i),
    ).toBeInTheDocument();
  });

  it("shows the asymmetric helper text for asymmetric types", () => {
    render(<Harness initialType="mentor_student" />);
    expect(
      screen.getByText(/no reverse entry is created/i),
    ).toBeInTheDocument();
  });
});
