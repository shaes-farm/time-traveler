import type { Meta, StoryObj } from "@storybook/react-vite";
import { EraTimelineStrip } from "./era-timeline-strip";

const meta = {
  title: "Components/EraTimelineStrip",
  component: EraTimelineStrip,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    defaultScale: {
      control: "select",
      options: ["log", "linear"],
    },
  },
} satisfies Meta<typeof EraTimelineStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Linear: Story = {
  args: {
    defaultScale: "linear",
  },
};

export const CustomMarkers: Story = {
  args: {
    kicker: "A shorter span",
    markers: [
      {
        name: "Rome founded",
        yearsAgo: 2779,
        era: "BCE",
        value: "753 BCE",
        labelPosition: "above",
      },
      {
        name: "Fall of Rome",
        yearsAgo: 1550,
        era: "CE",
        value: "476 CE",
        labelPosition: "below",
      },
      {
        name: "Today",
        yearsAgo: 1,
        era: "CE",
        value: "2026 CE",
        labelPosition: "above",
      },
    ],
  },
};
