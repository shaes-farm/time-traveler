import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toVocabulary } from "@repo/services/schemas/relationship-vocabulary";
import type {
  RelationshipCategoryMeta,
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

import {
  RelationshipTypeSelector,
  type RelationshipType,
} from "./relationship-type-selector";

// ─── Vocabulary fixture ──────────────────────────────────────────────────────
//
// The selector is data-driven since #419, so these tests supply a vocabulary
// rather than asserting against a compiled-in list of types.

const mkRole = (type_key: string, key: string): RelationshipRoleMeta => ({
  type_key,
  key,
  label: key,
  inverse_key: null,
  sort_order: 0,
  is_active: true,
});

const mkType = (
  key: string,
  category_key: string,
  overrides: Partial<RelationshipTypeMeta> = {},
): RelationshipTypeMeta => ({
  key,
  label: key,
  category_key,
  sort_order: 0,
  is_symmetric: true,
  inverse_key: null,
  direction_verb: null,
  symmetric_noun: null,
  description: null,
  is_active: true,
  roles: [],
  ...overrides,
});

const CATEGORIES: RelationshipCategoryMeta[] = [
  {
    key: "family",
    label: "Family",
    description: null,
    sort_order: 10,
    is_active: true,
    types: [
      mkType("family", "family", {
        roles: [
          mkRole("family", "spouse"),
          mkRole("family", "parent"),
          mkRole("family", "step_parent"),
          mkRole("family", "other"),
        ],
      }),
    ],
  },
  {
    key: "professional",
    label: "Professional",
    description: null,
    sort_order: 20,
    is_active: true,
    types: [
      mkType("professional", "professional", {
        roles: [
          mkRole("professional", "employer"),
          mkRole("professional", "employee"),
          mkRole("professional", "other"),
        ],
      }),
      mkType("collaboration", "professional", {
        roles: [
          mkRole("collaboration", "research_partner"),
          mkRole("collaboration", "other"),
        ],
      }),
    ],
  },
  {
    key: "social",
    label: "Social / Personal",
    description: null,
    sort_order: 30,
    is_active: true,
    types: [mkType("friendship", "social"), mkType("rivalry", "social")],
  },
  {
    key: "antagonistic",
    label: "Antagonistic",
    description: null,
    sort_order: 40,
    is_active: true,
    types: [mkType("enemy", "antagonistic")],
  },
  {
    key: "asymmetric",
    label: "Asymmetric",
    description: null,
    sort_order: 50,
    is_active: true,
    types: [
      mkType("mentor_student", "asymmetric", {
        is_symmetric: false,
        direction_verb: "mentors",
      }),
      mkType("owner_pet", "asymmetric", { is_symmetric: false }),
      mkType("trainer_trainee", "asymmetric", { is_symmetric: false }),
      mkType("creator_creation", "asymmetric", { is_symmetric: false }),
      mkType("worship", "asymmetric", { is_symmetric: false }),
    ],
  },
];

type SelectorChange = {
  type: RelationshipType;
  role: string | null;
};

function Harness({
  initialType = "friendship" as RelationshipType,
  initialRole = null as string | null,
  onChange,
  categories = CATEGORIES,
}: {
  initialType?: RelationshipType;
  initialRole?: string | null;
  onChange?: (next: SelectorChange) => void;
  categories?: RelationshipCategoryMeta[];
}) {
  const [type, setType] = useState<RelationshipType>(initialType);
  const [role, setRole] = useState<string | null>(initialRole);
  return (
    <RelationshipTypeSelector
      type={type}
      role={role}
      categories={categories}
      vocabulary={toVocabulary(categories)}
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

  it("renders one radio per type in the supplied vocabulary", () => {
    render(<Harness />);

    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Social / Personal")).toBeInTheDocument();
    expect(screen.getByText("Antagonistic")).toBeInTheDocument();
    expect(screen.getByText("Asymmetric")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(11);
  });

  it("grows with the vocabulary — a new type needs no code change (#419)", () => {
    const extended: RelationshipCategoryMeta[] = [
      ...CATEGORIES,
      {
        key: "derivational",
        label: "Derivational",
        description: null,
        sort_order: 60,
        is_active: true,
        types: [
          mkType("superseded", "derivational", {
            is_symmetric: false,
            direction_verb: "superseded",
          }),
        ],
      },
    ];
    render(<Harness categories={extended} />);

    expect(screen.getByText("Derivational")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(12);
  });

  it("renders category legends in the order supplied by the service", () => {
    const { container } = render(<Harness />);
    const legends = Array.from(container.querySelectorAll("legend")).map(
      (el) => el.textContent,
    );
    expect(legends).toEqual([
      "Family",
      "Professional",
      "Social / Personal",
      "Antagonistic",
      "Asymmetric",
    ]);
  });

  it("renders one radio per asymmetric type", () => {
    render(<Harness />);
    const fieldset = screen.getByTestId("relationship-type-family-asymmetric");
    const radios = within(fieldset).getAllByRole("radio");
    expect(radios).toHaveLength(5);
  });

  // ─── Empty state ───────────────────────────────────────────────────────────

  it("explains itself when no vocabulary is seeded", () => {
    // A fresh database before the baseline vocabulary migration runs.
    render(<Harness categories={[]} />);

    expect(screen.getByTestId("relationship-type-empty")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
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

  it("hides the role radio group for types that declare no roles", async () => {
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

  it("renders a radio per declared sub-role", () => {
    render(<Harness initialType="family" />);
    const group = screen.getByTestId("relationship-type-role-select");
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    expect(within(group).getByLabelText("spouse")).toBeInTheDocument();
    expect(within(group).getByLabelText("parent")).toBeInTheDocument();
    expect(within(group).getByLabelText("step_parent")).toBeInTheDocument();
  });

  it("renders the professional sub-roles when professional is selected", () => {
    render(<Harness initialType="professional" />);
    const group = screen.getByTestId("relationship-type-role-select");
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
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

  it("clears role when switching to a type that declares no roles", async () => {
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

  it("preserves role across types when the value is valid in both", async () => {
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

  it("clears role when the current value is not valid for the next type", async () => {
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

  it("promises a reverse entry for symmetric types", () => {
    render(<Harness initialType="friendship" />);
    expect(
      screen.getByText(/a reverse entry will be created automatically/i),
    ).toBeInTheDocument();
  });

  it("says no reverse entry for directed types", () => {
    render(<Harness initialType="mentor_student" />);
    expect(
      screen.getByText(/no reverse entry is created/i),
    ).toBeInTheDocument();
  });

  it("names the inverse type when one is declared", () => {
    const withInverse: RelationshipCategoryMeta[] = [
      {
        key: "derivational",
        label: "Derivational",
        description: null,
        sort_order: 10,
        is_active: true,
        types: [
          mkType("supersedes", "derivational", {
            label: "Supersedes",
            is_symmetric: false,
            inverse_key: "superseded_by",
          }),
          mkType("superseded_by", "derivational", {
            label: "Superseded by",
            is_symmetric: false,
          }),
        ],
      },
    ];
    render(<Harness initialType="supersedes" categories={withInverse} />);
    expect(
      screen.getByText(/reverse entry will be created as "Superseded by"/i),
    ).toBeInTheDocument();
  });
});
