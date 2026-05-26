import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./status-badge";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  parameters: { layout: "centered" },
  argTypes: {
    status: {
      control: "select",
      options: ["published", "draft", "shared"],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = { args: { status: "published" } };
export const Draft: Story = { args: { status: "draft" } };
export const Shared: Story = { args: { status: "shared" } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-3">
      <StatusBadge status="published" />
      <StatusBadge status="draft" />
      <StatusBadge status="shared" />
    </div>
  ),
};
