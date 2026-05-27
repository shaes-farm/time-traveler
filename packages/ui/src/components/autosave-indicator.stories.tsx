import type { Meta, StoryObj } from "@storybook/react-vite";

import { AutosaveIndicator } from "./autosave-indicator";

const meta = {
  title: "Components/Autosave Indicator",
  component: AutosaveIndicator,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AutosaveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

export const Saved: Story = {
  args: {
    savedAt: new Date("2026-05-27T14:34:00Z"),
  },
};
