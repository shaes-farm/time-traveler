import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CollaboratorList,
  type Collaborator,
  type CollaboratorOwner,
  type CollaboratorRole,
  type ResolvedProfile,
} from "./collaborator-list";

const meta = {
  title: "Components/Collaborator List",
  component: CollaboratorList,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CollaboratorList>;
export default meta;

type Story = StoryObj<typeof meta>;

const OWNER: CollaboratorOwner = {
  displayName: "Philipe Banglarian (you)",
  username: "philipeb",
};

const OWNER_ID = "owner-1";

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

// Demo resolver — pretends any typed username resolves to a fresh profile.
const demoResolve = async (username: string): Promise<ResolvedProfile> => ({
  id: String(Date.now()),
  username,
  displayName: username,
});

function Managed({ canManage = true }: { canManage?: boolean }) {
  const [collaborators, setCollaborators] =
    React.useState<Collaborator[]>(INITIAL);

  return (
    <div className="max-w-xl">
      <CollaboratorList
        collaborators={collaborators}
        owner={OWNER}
        ownerUserId={OWNER_ID}
        canManage={canManage}
        resolveUsername={demoResolve}
        onAdd={(userId, role) =>
          setCollaborators((prev) => [
            ...prev,
            {
              id: userId,
              username: userId,
              displayName: userId,
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
  args: { collaborators: INITIAL, owner: OWNER, ownerUserId: OWNER_ID },
  render: () => <Managed />,
};

export const ReadOnly: Story = {
  args: {
    collaborators: INITIAL,
    owner: OWNER,
    ownerUserId: OWNER_ID,
    canManage: false,
  },
  render: () => <Managed canManage={false} />,
};

export const Empty: Story = {
  args: { collaborators: [], owner: OWNER, ownerUserId: OWNER_ID },
};
