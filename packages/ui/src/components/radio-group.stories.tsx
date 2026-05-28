import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "Components/Radio Group",
  component: RadioGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function ColorPickerHarness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = React.useState("amber");
  return (
    <RadioGroup
      value={value}
      onValueChange={setValue}
      disabled={disabled}
      className="gap-2"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id="amber" value="amber" />
        <Label htmlFor="amber" className="font-normal">
          Amber
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="teal" value="teal" />
        <Label htmlFor="teal" className="font-normal">
          Teal
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="magenta" value="magenta" />
        <Label htmlFor="magenta" className="font-normal">
          Magenta
        </Label>
      </div>
    </RadioGroup>
  );
}

export const Default: Story = {
  render: () => <ColorPickerHarness />,
};

export const Disabled: Story = {
  render: () => <ColorPickerHarness disabled />,
};

/**
 * Grouped via <fieldset>/<legend> — the pattern Batch H's
 * RelationshipTypeSelector consumes. A single RadioGroup wraps multiple
 * fieldsets so the radio semantics stay correct while the DOM still
 * communicates the family-level grouping to assistive tech.
 */
export const Grouped: Story = {
  render: () => {
    function Wrapper() {
      const [value, setValue] = React.useState("family");
      return (
        <RadioGroup value={value} onValueChange={setValue} className="gap-4">
          <fieldset className="space-y-2 border-0 p-0">
            <legend className="mb-1 text-xs uppercase tracking-wider text-foreground-muted">
              Symmetric
            </legend>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="g-family" value="family" />
              <Label htmlFor="g-family" className="font-normal">
                Family
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="g-friendship" value="friendship" />
              <Label htmlFor="g-friendship" className="font-normal">
                Friendship
              </Label>
            </div>
          </fieldset>
          <fieldset className="space-y-2 border-0 p-0">
            <legend className="mb-1 text-xs uppercase tracking-wider text-foreground-muted">
              Asymmetric
            </legend>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="g-mentor" value="mentor_student" />
              <Label htmlFor="g-mentor" className="font-normal">
                Mentor / Student
              </Label>
            </div>
          </fieldset>
        </RadioGroup>
      );
    }
    return <Wrapper />;
  },
};
