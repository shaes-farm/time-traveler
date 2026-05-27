import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SlugField } from "./slug-field";

const meta = {
  title: "Components/Slug Field",
  component: SlugField,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SlugField>;

export default meta;
type Story = StoryObj<typeof meta>;

function SlugFieldStory() {
  const [source, setSource] = useState("A Fresh Character");
  const [slug, setSlug] = useState("");

  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Source title</span>
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
      </label>
      <SlugField
        value={slug}
        onChange={setSlug}
        sourceValue={source}
        existingSlugs={["a-fresh-character"]}
      />
    </div>
  );
}

export const Default: Story = {
  args: {
    value: "",
    onChange: () => {},
    sourceValue: "",
  },
  render: () => <SlugFieldStory />,
};
