import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

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

function Harness({
  initialType,
  initialRole = null,
}: {
  initialType: RelationshipType;
  initialRole?: string | null;
}) {
  const [type, setType] = React.useState<RelationshipType>(initialType);
  const [role, setRole] = React.useState<string | null>(initialRole);

  return (
    <div className="max-w-sm">
      <RelationshipTypeSelector
        type={type}
        role={role}
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

export const Default: Story = {
  args: {
    type: "friendship",
    role: null,
    onChange: () => {},
  },
  render: () => <Harness initialType="friendship" />,
};

export const Family: Story = {
  args: {
    type: "family",
    role: "spouse",
    onChange: () => {},
  },
  render: () => <Harness initialType="family" initialRole="spouse" />,
};

export const Professional: Story = {
  args: {
    type: "professional",
    role: "employer",
    onChange: () => {},
  },
  render: () => <Harness initialType="professional" initialRole="employer" />,
};
