import type { Meta, StoryObj } from "@storybook/react-vite";

import { SaveDropdown } from "./save-dropdown";

const meta = {
  title: "Components/Save Dropdown",
  component: SaveDropdown,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SaveDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSave: () => {},
    onSaveAndAddAnother: () => {},
    onSaveAsDraft: () => {},
    onSaveAndPublish: () => {},
  },
};
