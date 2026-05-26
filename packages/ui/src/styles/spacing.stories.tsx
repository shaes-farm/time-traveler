import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Spacing",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

const steps = [
  { token: "0.5", className: "w-0.5", px: 2 },
  { token: "1", className: "w-1", px: 4 },
  { token: "2", className: "w-2", px: 8 },
  { token: "3", className: "w-3", px: 12 },
  { token: "4", className: "w-4", px: 16 },
  { token: "6", className: "w-6", px: 24 },
  { token: "8", className: "w-8", px: 32 },
  { token: "12", className: "w-12", px: 48 },
  { token: "16", className: "w-16", px: 64 },
  { token: "24", className: "w-24", px: 96 },
];

export const Ramp: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl text-foreground">Spacing ramp</h2>
      <p className="text-sm text-foreground-muted">
        Tailwind 4 default scale. Time Traveler doesn&apos;t override the ramp;
        later batches may add semantic aliases (e.g. inline gap, section gap) if
        a primitive surfaces the need.
      </p>
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <div
            key={step.token}
            className="flex items-center gap-3 rounded border border-border-muted bg-surface px-3 py-1.5"
          >
            <code className="font-mono text-xs text-foreground-subtle w-12">
              {step.token}
            </code>
            <div className={`${step.className} h-4 rounded bg-primary`} />
            <code className="font-mono text-xs text-foreground-muted">
              {step.px}px
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

const radii = [
  { token: "--radius-sm", className: "rounded-sm", value: "0.25rem" },
  { token: "--radius-md", className: "rounded-md", value: "0.5rem" },
  { token: "--radius-lg", className: "rounded-lg", value: "0.75rem" },
];

export const Radii: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl text-foreground">Radii</h2>
      <div className="flex gap-4">
        {radii.map((r) => (
          <div key={r.token} className="flex flex-col items-center gap-2">
            <div
              className={`h-16 w-16 ${r.className} bg-surface-2 border border-border`}
            />
            <code className="font-mono text-xs text-foreground">{r.token}</code>
            <code className="font-mono text-xs text-foreground-muted">
              {r.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};
