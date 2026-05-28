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
  isReversed: boolean;
};

function Harness({
  initialType = "friendship" as RelationshipType,
  initialRole = null as string | null,
  initialIsReversed = false,
  focalCharacterName,
  otherCharacterName,
  onChange,
}: {
  initialType?: RelationshipType;
  initialRole?: string | null;
  initialIsReversed?: boolean;
  focalCharacterName?: string;
  otherCharacterName?: string;
  onChange?: (next: SelectorChange) => void;
}) {
  const [type, setType] = useState<RelationshipType>(initialType);
  const [role, setRole] = useState<string | null>(initialRole);
  const [isReversed, setIsReversed] = useState<boolean>(initialIsReversed);
  return (
    <RelationshipTypeSelector
      type={type}
      role={role}
      isReversed={isReversed}
      focalCharacterName={focalCharacterName}
      otherCharacterName={otherCharacterName}
      onChange={(next) => {
        setType(next.type);
        setRole(next.role);
        setIsReversed(next.isReversed);
        onChange?.(next);
      }}
    />
  );
}

describe("RelationshipTypeSelector", () => {
  // ─── Type radios ────────────────────────────────────────────────────────────

  it("renders 16 type radios total (6 symmetric + 10 paired asymmetric)", () => {
    render(<Harness />);

    // 5 fieldset legends
    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Social / Personal")).toBeInTheDocument();
    expect(screen.getByText("Antagonistic")).toBeInTheDocument();
    expect(screen.getByText("Asymmetric")).toBeInTheDocument();

    // 6 symmetric radios (family + professional + collaboration +
    // friendship + rivalry + enemy) + 10 paired asymmetric radios = 16.
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(16);
  });

  it("renders paired radios per asymmetric type (10 rows in the Asymmetric fieldset)", () => {
    render(<Harness />);
    const fieldset = screen.getByTestId("relationship-type-family-asymmetric");
    const radios = within(fieldset).getAllByRole("radio");
    expect(radios).toHaveLength(10);
  });

  // ─── Sub-role radio group (replaces the prior combobox interactions) ────────

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
      isReversed: false,
    });
  });

  // ─── Role carry/clear logic (existing behaviour, updated for isReversed) ───

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
      isReversed: false,
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
      isReversed: false,
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
      isReversed: false,
    });
  });

  // ─── Asymmetric direction support ──────────────────────────────────────────

  it("interpolates focal + other names into asymmetric paired-radio labels", () => {
    render(<Harness focalCharacterName="Marie" otherCharacterName="Pierre" />);
    const fieldset = screen.getByTestId("relationship-type-family-asymmetric");
    expect(
      within(fieldset).getByLabelText("Marie mentors Pierre"),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByLabelText("Pierre mentors Marie"),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByLabelText("Marie owns Pierre"),
    ).toBeInTheDocument();
  });

  it("falls back to generic labels when focal/other names are not provided", () => {
    render(<Harness />);
    const fieldset = screen.getByTestId("relationship-type-family-asymmetric");
    expect(
      within(fieldset).getByLabelText("This character mentors Other"),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByLabelText("Other mentors This character"),
    ).toBeInTheDocument();
  });

  it("selecting a reversed asymmetric radio emits isReversed: true", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        focalCharacterName="Marie"
        otherCharacterName="Pierre"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("Pierre mentors Marie"));

    expect(onChange).toHaveBeenCalledWith({
      type: "mentor_student",
      role: null,
      isReversed: true,
    });
  });

  it("selecting a forward asymmetric radio emits isReversed: false", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        focalCharacterName="Marie"
        otherCharacterName="Pierre"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("Marie mentors Pierre"));

    expect(onChange).toHaveBeenCalledWith({
      type: "mentor_student",
      role: null,
      isReversed: false,
    });
  });

  it("resets isReversed to false when switching from an asymmetric type to a symmetric type", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initialType="mentor_student"
        initialIsReversed
        focalCharacterName="Marie"
        otherCharacterName="Pierre"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("friendship"));

    expect(onChange).toHaveBeenCalledWith({
      type: "friendship",
      role: null,
      isReversed: false,
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
    expect(screen.getByText(/direction matters/i)).toBeInTheDocument();
  });
});
