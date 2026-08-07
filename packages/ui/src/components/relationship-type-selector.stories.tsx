import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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

const meta = {
  title: "Components/Relationship Type Selector",
  component: RelationshipTypeSelector,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RelationshipTypeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Vocabulary fixture ──────────────────────────────────────────────────────
//
// The selector renders whatever the `relationship_categories` → `relationship_types`
// → `relationship_roles` tables contain (#419), so stories supply a stand-in for
// the fetched vocabulary rather than relying on a compiled-in list.

const mkRole = (
  type_key: string,
  key: string,
  label: string,
): RelationshipRoleMeta => ({
  type_key,
  key,
  label,
  inverse_key: null,
  sort_order: 0,
  is_active: true,
});

const mkType = (
  key: string,
  label: string,
  category_key: string,
  overrides: Partial<RelationshipTypeMeta> = {},
): RelationshipTypeMeta => ({
  key,
  label,
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
      mkType("family", "Family", "family", {
        symmetric_noun: "relatives",
        roles: [
          mkRole("family", "spouse", "Spouse"),
          mkRole("family", "parent", "Parent"),
          mkRole("family", "child", "Child"),
          mkRole("family", "sibling", "Sibling"),
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
      mkType("professional", "Professional", "professional", {
        symmetric_noun: "colleagues",
        roles: [
          mkRole("professional", "employer", "Employer"),
          mkRole("professional", "employee", "Employee"),
          mkRole("professional", "colleague", "Colleague"),
        ],
      }),
      mkType("collaboration", "Collaboration", "professional", {
        symmetric_noun: "collaborators",
        roles: [
          mkRole("collaboration", "co_author", "Co-author"),
          mkRole("collaboration", "co_founder", "Co-founder"),
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
    types: [
      mkType("friendship", "Friendship", "social", {
        symmetric_noun: "friends",
      }),
      mkType("rivalry", "Rivalry", "social", { symmetric_noun: "rivals" }),
    ],
  },
  {
    key: "asymmetric",
    label: "Asymmetric",
    description: null,
    sort_order: 40,
    is_active: true,
    types: [
      mkType("mentor_student", "Mentor / student", "asymmetric", {
        is_symmetric: false,
        direction_verb: "mentors",
      }),
      mkType("creator_creation", "Creator / creation", "asymmetric", {
        is_symmetric: false,
        direction_verb: "created",
      }),
    ],
  },
  {
    key: "derivational",
    label: "Derivational",
    description: null,
    sort_order: 50,
    is_active: true,
    types: [
      mkType("supersedes", "Supersedes", "derivational", {
        is_symmetric: false,
        inverse_key: "superseded_by",
        direction_verb: "superseded",
      }),
      mkType("superseded_by", "Superseded by", "derivational", {
        is_symmetric: false,
        direction_verb: "was superseded by",
      }),
    ],
  },
];

const VOCABULARY = toVocabulary(CATEGORIES);

function Harness({
  initialType,
  initialRole = null,
  categories = CATEGORIES,
}: {
  initialType: RelationshipType;
  initialRole?: string | null;
  categories?: RelationshipCategoryMeta[];
}) {
  const [type, setType] = React.useState<RelationshipType>(initialType);
  const [role, setRole] = React.useState<string | null>(initialRole);

  return (
    <div className="max-w-sm">
      <RelationshipTypeSelector
        type={type}
        role={role}
        categories={categories}
        vocabulary={toVocabulary(categories)}
        onChange={(next) => {
          setType(next.type);
          setRole(next.role);
        }}
      />
      <p className="mt-4 font-mono text-xs text-foreground-muted">
        Selected: <span className="text-foreground">{type}</span>
        {role && (
          <>
            {" "}
            · role=<span className="text-foreground">{role}</span>
          </>
        )}
      </p>
    </div>
  );
}

const baseArgs = {
  categories: CATEGORIES,
  vocabulary: VOCABULARY,
  onChange: () => {},
};

export const Default: Story = {
  args: { ...baseArgs, type: "friendship", role: null },
  render: () => <Harness initialType="friendship" />,
};

export const Family: Story = {
  args: { ...baseArgs, type: "family", role: "spouse" },
  render: () => <Harness initialType="family" initialRole="spouse" />,
};

export const Professional: Story = {
  args: { ...baseArgs, type: "professional", role: "employer" },
  render: () => <Harness initialType="professional" initialRole="employer" />,
};

/** A directed type that names its inverse — the helper text should say so. */
export const WithInverseType: Story = {
  args: { ...baseArgs, type: "supersedes", role: null },
  render: () => <Harness initialType="supersedes" />,
};

/** A database that has not yet run the baseline vocabulary migration. */
export const EmptyVocabulary: Story = {
  args: { ...baseArgs, categories: [], type: "", role: null },
  render: () => <Harness initialType="" categories={[]} />,
};
