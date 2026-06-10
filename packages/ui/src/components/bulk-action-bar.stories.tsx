import type { Meta, StoryObj } from "@storybook/react-vite";

import { BulkActionBar } from "./bulk-action-bar";

const meta = {
  title: "Components/Bulk Action Bar",
  component: BulkActionBar,
  parameters: { layout: "padded" },
  args: {
    count: 4,
    entityLabel: "event",
    onClear: () => {},
  },
} satisfies Meta<typeof BulkActionBar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleRow: Story = {
  args: { count: 1 },
};

export const WithSkipped: Story = {
  args: { count: 3, skippedCount: 2 },
};

export const Busy: Story = {
  args: { busy: true },
};

export const Timelines: Story = {
  args: { count: 2, entityLabel: "timeline" },
};
