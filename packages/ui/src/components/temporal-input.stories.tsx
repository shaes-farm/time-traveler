import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TemporalInput } from "./temporal-input";
import type { TemporalData } from "@repo/services/schemas/temporal";

const meta = {
  title: "Components/Temporal Input",
  component: TemporalInput,
  parameters: { layout: "padded" },
  args: { value: null, onChange: () => {} },
} satisfies Meta<typeof TemporalInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function TemporalInputHarness({
  seed,
  label = "Date",
  required = false,
  disabled = false,
  error,
}: {
  seed: TemporalData | null;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const [value, setValue] = useState<TemporalData | null>(seed);
  return (
    <div className="max-w-md">
      <TemporalInput
        label={label}
        value={value}
        onChange={setValue}
        required={required}
        disabled={disabled}
        error={error}
      />
    </div>
  );
}

export const Empty: Story = {
  render: () => <TemporalInputHarness seed={null} label="Birth date" />,
};

export const Modern: Story = {
  render: () => (
    <TemporalInputHarness
      label="Birth"
      seed={{
        year: 1867,
        month: 11,
        day: 7,
        era: "CE",
        precision: "exact",
      }}
    />
  ),
};

export const Historical: Story = {
  render: () => (
    <TemporalInputHarness
      label="Assassination"
      seed={{ year: 44, era: "BCE", precision: "circa" }}
    />
  ),
};

export const Ancient: Story = {
  render: () => (
    <TemporalInputHarness
      label="Emergence"
      seed={{
        year: 160,
        era: "KYA",
        precision: "approximate",
        uncertainty: 10_000,
      }}
    />
  ),
};

export const Geological: Story = {
  render: () => (
    <TemporalInputHarness
      label="Extinction event"
      seed={{
        year: 66,
        era: "MYA",
        precision: "approximate",
        uncertainty: 1_000_000,
        geological_period: "Cretaceous–Paleogene boundary",
        dating_method: "Radiometric",
        confidence_level: "high",
        source: "Wikipedia: K–Pg boundary",
      }}
    />
  ),
};

export const Cosmic: Story = {
  render: () => (
    <TemporalInputHarness
      label="Big Bang"
      seed={{
        year: 14,
        era: "BYA",
        precision: "estimated",
        cosmological_epoch: "Inflation",
      }}
    />
  ),
};

export const Required: Story = {
  render: () => (
    <TemporalInputHarness seed={null} label="Start date" required />
  ),
};

export const WithError: Story = {
  render: () => (
    <TemporalInputHarness
      label="Date"
      seed={{ year: 300_000, era: "CE", precision: "exact" }}
      error="This date exceeds the supported CE range."
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <TemporalInputHarness
      label="Locked date"
      seed={{ year: 1789, era: "CE", precision: "exact" }}
      disabled
    />
  ),
};
