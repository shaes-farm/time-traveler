import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PublishControl } from "./publish-control";

const meta = {
  title: "Components/Publish Control",
  component: PublishControl,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PublishControl>;
export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({ initial }: { initial: boolean }) {
  const [published, setPublished] = React.useState(initial);
  return (
    <PublishControl
      published={published}
      entityLabel="timeline"
      onPublish={() => setPublished(true)}
      onUnpublish={() => setPublished(false)}
    />
  );
}

export const Draft: Story = {
  args: { published: false, entityLabel: "timeline" },
  render: () => <Controlled initial={false} />,
};

export const Published: Story = {
  args: { published: true, entityLabel: "timeline" },
  render: () => <Controlled initial />,
};

export const ReadOnly: Story = {
  args: {
    published: true,
    entityLabel: "timeline",
    canPublish: false,
  },
};
