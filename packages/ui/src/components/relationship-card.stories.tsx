import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TemporalData } from "@repo/services/schemas/temporal.js";

import { RelationshipCard } from "./relationship-card";

const meta = {
  title: "Components/Relationship Card",
  component: RelationshipCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RelationshipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const T = (
  data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">,
): TemporalData => ({ precision: "exact", ...data });

const noop = () => {};

// ─── Fixtures by type-family group ───────────────────────────────────────────

export const Family: Story = {
  args: {
    otherCharacter: {
      name: "Pierre Curie",
      slug: "pierre-curie",
      characterType: "human",
      initials: "PC",
    },
    relationshipType: "family",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Pierre Curie",
        slug: "pierre-curie",
        characterType: "human",
        initials: "PC",
      }}
      relationshipType="family"
      relationshipRole="spouse"
      startTemporal={T({ year: 1895, era: "CE" })}
      endTemporal={T({ year: 1906, era: "CE" })}
      description="Marriage; collaborated on the discovery of polonium and radium."
      onEdit={noop}
      onDuplicate={noop}
      onDelete={noop}
    />
  ),
};

export const Professional: Story = {
  args: {
    otherCharacter: {
      name: "Université de Paris",
      slug: "universite-de-paris",
      characterType: "organization",
      initials: "UP",
    },
    relationshipType: "professional",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Université de Paris",
        slug: "universite-de-paris",
        characterType: "organization",
        initials: "UP",
      }}
      relationshipType="professional"
      relationshipRole="employer"
      startTemporal={T({ year: 1906, era: "CE" })}
      endTemporal={T({ year: 1934, era: "CE" })}
      description="First female professor at the Sorbonne."
      onEdit={noop}
      onDuplicate={noop}
      onDelete={noop}
    />
  ),
};

export const SocialPersonal: Story = {
  args: {
    otherCharacter: {
      name: "Albert Einstein",
      slug: "albert-einstein",
      characterType: "human",
      initials: "AE",
    },
    relationshipType: "friendship",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Albert Einstein",
        slug: "albert-einstein",
        characterType: "human",
        initials: "AE",
      }}
      relationshipType="friendship"
      startTemporal={T({ year: 1909, era: "CE" })}
      endTemporal={T({ year: 1934, era: "CE" })}
      description="Met at the 1911 Solvay Conference; corresponded for years."
      onEdit={noop}
      onDelete={noop}
    />
  ),
};

export const Antagonistic: Story = {
  args: {
    otherCharacter: {
      name: "Paul Langevin",
      slug: "paul-langevin",
      characterType: "human",
      initials: "PL",
    },
    relationshipType: "rivalry",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Paul Langevin",
        slug: "paul-langevin",
        characterType: "human",
        initials: "PL",
      }}
      relationshipType="rivalry"
      startTemporal={T({ year: 1910, era: "CE" })}
      endTemporal={T({ year: 1911, era: "CE" })}
      description="Public scandal following the affair and divorce proceedings."
      onEdit={noop}
      onDelete={noop}
    />
  ),
};

export const Asymmetric: Story = {
  args: {
    otherCharacter: {
      name: "Henri Poincaré",
      slug: "henri-poincare",
      characterType: "human",
      initials: "HP",
    },
    relationshipType: "mentor_student",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Henri Poincaré",
        slug: "henri-poincare",
        characterType: "human",
        initials: "HP",
      }}
      relationshipType="mentor_student"
      directionLabel="Marie was mentored by Henri"
      startTemporal={T({ year: 1895, era: "CE" })}
      endTemporal={T({ year: 1903, era: "CE" })}
      onEdit={noop}
      onDelete={noop}
    />
  ),
};

// ─── State variants ──────────────────────────────────────────────────────────

export const Reciprocal: Story = {
  args: {
    otherCharacter: {
      name: "Irène Joliot-Curie",
      slug: "irene-joliot-curie",
      characterType: "human",
      initials: "IJ",
    },
    relationshipType: "family",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Irène Joliot-Curie",
        slug: "irene-joliot-curie",
        characterType: "human",
        initials: "IJ",
      }}
      relationshipType="family"
      relationshipRole="parent"
      directionLabel="Marie is mother of Irène"
      startTemporal={T({ year: 1897, era: "CE" })}
      isReciprocal
      onEdit={noop}
      onDuplicate={noop}
      onDelete={noop}
    />
  ),
};

export const Contradiction: Story = {
  args: {
    otherCharacter: {
      name: "Pierre Curie",
      slug: "pierre-curie",
      characterType: "human",
      initials: "PC",
    },
    relationshipType: "family",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Pierre Curie",
        slug: "pierre-curie",
        characterType: "human",
        initials: "PC",
      }}
      relationshipType="family"
      relationshipRole="parent"
      startTemporal={T({ year: 1895, era: "CE" })}
      contradiction="Pierre Curie is also recorded as your spouse — confirm this is intentional."
      onEdit={noop}
      onDelete={noop}
    />
  ),
};

export const EmptyTemporal: Story = {
  args: {
    otherCharacter: {
      name: "Frédéric Joliot-Curie",
      slug: "frederic-joliot-curie",
      characterType: "human",
      initials: "FJ",
    },
    relationshipType: "family",
  },
  render: () => (
    <RelationshipCard
      otherCharacter={{
        name: "Frédéric Joliot-Curie",
        slug: "frederic-joliot-curie",
        characterType: "human",
        initials: "FJ",
      }}
      relationshipType="family"
      relationshipRole="in_law"
      onEdit={noop}
      onDelete={noop}
    />
  ),
};
