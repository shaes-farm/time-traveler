import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const eras = [
  "CE — Common Era",
  "BCE — Before Common Era",
  "KYA — Thousand years ago",
  "MYA — Million years ago",
  "BYA — Billion years ago",
  "Geological — Phanerozoic eon",
  "Geological — Proterozoic eon",
  "Geological — Archean eon",
  "Geological — Hadean eon",
  "Speculative — Future",
];

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-md border border-border p-3">
      <div className="space-y-2 text-sm text-foreground">
        {eras.map((era) => (
          <div key={era}>{era}</div>
        ))}
      </div>
    </ScrollArea>
  ),
};
