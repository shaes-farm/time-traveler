import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CollaboratorList,
  type Collaborator,
  type CollaboratorRole,
} from "./collaborator-list";

const meta = {
  title: "Components/Collaborator List",
  component: CollaboratorList,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CollaboratorList>;
export default meta;

type Story = StoryObj<typeof meta>;

const INITIAL: Collaborator[] = [
  {
    id: "1",
    username: "irenejc",
    displayName: "Irène Joliot-Curie",
    role: "editor",
  },
  {
    id: "2",
    username: "ebranly",
    displayName: "Édouard Branly",
    role: "viewer",
  },
];

function Managed({ canManage = true }: { canManage?: boolean }) {
  const [collaborators, setCollaborators] =
    React.useState<Collaborator[]>(INITIAL);

  return (
    <div className="max-w-xl">
      <CollaboratorList
        collaborators={collaborators}
        ownerName="Philipe Banglarian (you)"
        canManage={canManage}
        onAdd={(username, role) =>
          setCollaborators((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              username,
              displayName: username,
              role,
            },
          ])
        }
        onRemove={(id) =>
          setCollaborators((prev) => prev.filter((c) => c.id !== id))
        }
        onRoleChange={(id, role: CollaboratorRole) =>
          setCollaborators((prev) =>
            prev.map((c) => (c.id === id ? { ...c, role } : c)),
          )
        }
      />
    </div>
  );
}

export const Default: Story = {
  args: { collaborators: INITIAL, ownerName: "You" },
  render: () => <Managed />,
};

export const ReadOnly: Story = {
  args: { collaborators: INITIAL, ownerName: "You", canManage: false },
  render: () => <Managed canManage={false} />,
};

export const Empty: Story = {
  args: { collaborators: [], ownerName: "You" },
};
