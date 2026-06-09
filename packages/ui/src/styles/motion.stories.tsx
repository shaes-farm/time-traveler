import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { durations, easings } from "./tokens";

/**
 * Motion foundations — demonstrates the five named motion classes from
 * docs/design/public/06-mid-fidelity/motion-spec.md, bound to the motion-token
 * scale (ADR-0032). Toggle the OS "reduce motion" setting to confirm every
 * transition collapses to instant (the contract is enforced once at the token
 * layer in motion.css).
 */

const durationRows: { cssVar: string; tsName: keyof typeof durations }[] = [
  { cssVar: "--duration-instant", tsName: "instant" },
  { cssVar: "--duration-fast", tsName: "fast" },
  { cssVar: "--duration-base", tsName: "base" },
  { cssVar: "--duration-slow", tsName: "slow" },
  { cssVar: "--duration-deliberate", tsName: "deliberate" },
];

const easingRows: { cssVar: string; tsName: keyof typeof easings }[] = [
  { cssVar: "--ease-standard", tsName: "standard" },
  { cssVar: "--ease-decelerate", tsName: "decelerate" },
  { cssVar: "--ease-accelerate", tsName: "accelerate" },
];

const TokenTable = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h3 className="mb-2 font-display text-base text-foreground">Durations</h3>
      <div className="flex flex-col gap-1">
        {durationRows.map((row) => (
          <div key={row.cssVar} className="flex items-center gap-3 text-xs">
            <code className="w-48 font-mono text-foreground">{row.cssVar}</code>
            <code className="w-28 font-mono text-foreground-muted">
              durations.{row.tsName}
            </code>
            <code className="font-mono text-foreground-subtle">
              {durations[row.tsName]}
            </code>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="mb-2 font-display text-base text-foreground">Easing</h3>
      <div className="flex flex-col gap-1">
        {easingRows.map((row) => (
          <div key={row.cssVar} className="flex items-center gap-3 text-xs">
            <code className="w-48 font-mono text-foreground">{row.cssVar}</code>
            <code className="w-28 font-mono text-foreground-muted">
              easings.{row.tsName}
            </code>
            <code className="font-mono text-foreground-subtle">
              {easings[row.tsName]}
            </code>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DemoButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
  >
    {children}
  </button>
);

const Box = ({
  className,
  style,
  label,
}: {
  className?: string;
  style?: React.CSSProperties;
  label: string;
}) => (
  <div
    className={`flex h-20 w-40 items-center justify-center rounded-md border border-border bg-surface-2 text-xs text-foreground ${className ?? ""}`}
    style={style}
  >
    {label}
  </div>
);

const ClassDemo = ({
  name,
  binding,
  children,
}: {
  name: string;
  binding: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
    <div>
      <code className="font-mono text-sm text-foreground">.{name}</code>
      <span className="ml-2 text-xs text-foreground-muted">{binding}</span>
    </div>
    {children}
  </div>
);

const meta: Meta = {
  title: "Foundations/Motion",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const Tokens: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-display text-xl text-foreground">
          Motion tokens
        </h2>
        <p className="text-sm text-foreground-muted">
          The duration + easing scale fixed by ADR-0032 / motion-spec §1. The
          five motion classes bind to these names; under{" "}
          <code className="font-mono text-xs">prefers-reduced-motion</code>{" "}
          every duration collapses to 0ms in one place.
        </p>
      </div>
      <TokenTable />
    </div>
  ),
};

export const Classes: Story = {
  render: function ClassesStory() {
    const [zoomed, setZoomed] = useState(false);
    const [shifted, setShifted] = useState(false);
    const [faded, setFaded] = useState(false);
    const [open, setOpen] = useState(true);
    const [present, setPresent] = useState(true);

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground-muted">
          Trigger each class and watch the timing. Enable your OS &ldquo;reduce
          motion&rdquo; setting to confirm every change becomes instant.
        </p>

        <ClassDemo
          name="fractal-zoom"
          binding="deliberate (480ms) · standard — transform only"
        >
          <DemoButton onClick={() => setZoomed((v) => !v)}>
            Toggle zoom
          </DemoButton>
          <Box
            className="fractal-zoom"
            style={{ transform: zoomed ? "scale(1.4)" : "scale(1)" }}
            label="fractal-zoom"
          />
        </ClassDemo>

        <ClassDemo
          name="context-shift"
          binding="slow (320ms) · standard — 8px translate + opacity"
        >
          <DemoButton onClick={() => setShifted((v) => !v)}>
            Toggle shift
          </DemoButton>
          <Box
            className="context-shift"
            style={{
              transform: shifted ? "translateX(8px)" : "translateX(0)",
              opacity: shifted ? 1 : 0.4,
            }}
            label="context-shift"
          />
        </ClassDemo>

        <ClassDemo
          name="cross-fade"
          binding="base (200ms) · standard — opacity only"
        >
          <DemoButton onClick={() => setFaded((v) => !v)}>
            Toggle fade
          </DemoButton>
          <Box
            className="cross-fade"
            style={{ opacity: faded ? 0.2 : 1 }}
            label="cross-fade"
          />
        </ClassDemo>

        <ClassDemo
          name="enter-exit"
          binding="320ms decelerate in / 120ms accelerate out — scale + fade"
        >
          <DemoButton onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Open"}
          </DemoButton>
          {/* Node stays mounted; toggling data-state lets both halves of the
              choreography (enter + exit) be observed. In real usage Radix
              Presence supplies the same mounted-while-exiting behaviour. */}
          <div
            data-state={open ? "open" : "closed"}
            className="enter-exit flex h-20 w-40 items-center justify-center rounded-md border border-border bg-surface-2 text-xs text-foreground"
          >
            enter-exit ({open ? "open" : "closed"})
          </div>
        </ClassDemo>

        <ClassDemo
          name="ambient-presence"
          binding="≤ base (200ms) · opacity only — never pulse/blink"
        >
          <DemoButton onClick={() => setPresent((v) => !v)}>
            Toggle presence
          </DemoButton>
          <div className="flex items-center gap-2">
            <span
              className="ambient-presence h-2.5 w-2.5 rounded-full bg-era-ce"
              style={{ opacity: present ? 1 : 0 }}
              aria-hidden
            />
            <span className="text-xs text-foreground-muted">live dot</span>
          </div>
        </ClassDemo>
      </div>
    );
  },
};
