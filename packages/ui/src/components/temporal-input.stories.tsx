import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TemporalInput } from "./temporal-input";
import type { TemporalData } from "@repo/services/schemas/temporal.js";

const meta = {
  title: "Components/Temporal Input",
  component: TemporalInput,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof TemporalInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function TemporalInputStory() {
  const [value, setValue] = useState<TemporalData | null>({
    year: 2024,
    era: "CE",
    precision: "exact",
  });

  return <TemporalInput label="Date" value={value} onChange={setValue} />;
}

export const Default: Story = {
  args: {
    value: null,
    onChange: () => {},
  },
  render: () => <TemporalInputStory />,
};
