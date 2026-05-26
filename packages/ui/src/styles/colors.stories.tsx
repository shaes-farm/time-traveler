import type { Meta, StoryObj } from "@storybook/react-vite";
import { colors } from "./tokens.js";

type Swatch = {
  cssVar: string;
  tsName: keyof typeof colors;
  oklch: string;
  role: string;
};

const swatches: Swatch[] = [
  {
    cssVar: "--color-background",
    tsName: "background",
    oklch: colors.background,
    role: "Main canvas",
  },
  {
    cssVar: "--color-surface",
    tsName: "surface",
    oklch: colors.surface,
    role: "Cards, popovers, secondary buttons",
  },
  {
    cssVar: "--color-surface-2",
    tsName: "surface2",
    oklch: colors.surface2,
    role: "Raised surfaces, hover/accent states",
  },
  {
    cssVar: "--color-foreground",
    tsName: "foreground",
    oklch: colors.foreground,
    role: "Primary text",
  },
  {
    cssVar: "--color-foreground-muted",
    tsName: "foregroundMuted",
    oklch: colors.foregroundMuted,
    role: "Secondary text, descriptions",
  },
  {
    cssVar: "--color-foreground-subtle",
    tsName: "foregroundSubtle",
    oklch: colors.foregroundSubtle,
    role: "Placeholder text, hints",
  },
  {
    cssVar: "--color-border",
    tsName: "border",
    oklch: colors.border,
    role: "Default borders, input outlines",
  },
  {
    cssVar: "--color-border-muted",
    tsName: "borderMuted",
    oklch: colors.borderMuted,
    role: "Fainter dividers",
  },
  {
    cssVar: "--color-primary",
    tsName: "primary",
    oklch: colors.primary,
    role: "Primary action background",
  },
  {
    cssVar: "--color-primary-foreground",
    tsName: "primaryForeground",
    oklch: colors.primaryForeground,
    role: "Text on primary background",
  },
  {
    cssVar: "--color-destructive",
    tsName: "destructive",
    oklch: colors.destructive,
    role: "Delete / dangerous actions",
  },
  {
    cssVar: "--color-destructive-foreground",
    tsName: "destructiveForeground",
    oklch: colors.destructiveForeground,
    role: "Text on destructive background",
  },
];

const SwatchCard = ({ swatch }: { swatch: Swatch }) => (
  <button
    type="button"
    onClick={() => navigator.clipboard?.writeText(swatch.cssVar)}
    className="flex items-stretch gap-4 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
  >
    <div
      className="h-16 w-16 shrink-0 rounded border border-border-muted"
      style={{ background: swatch.oklch }}
      aria-hidden
    />
    <div className="flex flex-col justify-center gap-0.5">
      <code className="font-mono text-xs text-foreground">{swatch.cssVar}</code>
      <code className="font-mono text-xs text-foreground-muted">
        colors.{swatch.tsName}
      </code>
      <span className="text-xs text-foreground-subtle">{swatch.role}</span>
      <code className="font-mono text-[10px] text-foreground-subtle">
        {swatch.oklch}
      </code>
    </div>
  </button>
);

const meta: Meta = {
  title: "Foundations/Colors",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const Palette: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-display text-xl text-foreground">
          Color tokens
        </h2>
        <p className="text-sm text-foreground-muted">
          Click any swatch to copy its CSS variable name. Values are in OKLCH,
          mirrored from Tailwind 4&apos;s zinc palette plus a red-500 for
          destructive actions.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {swatches.map((swatch) => (
          <SwatchCard key={swatch.cssVar} swatch={swatch} />
        ))}
      </div>
      <div className="rounded-md border border-border bg-surface p-4">
        <h3 className="mb-2 font-display text-base text-foreground">
          Accent slots
        </h3>
        <p className="text-sm text-foreground-muted">
          Era hues (CE / BCE / KYA / MYA / BYA), status badges (Published /
          Draft / Shared), and the importance gradient (1–10) are intentionally
          unfilled until later batches consume them — see Batches E, B, and F
          respectively in{" "}
          <code className="font-mono text-xs">
            docs/design/admin/fidelity-2-plan.md
          </code>
          .
        </p>
      </div>
    </div>
  ),
};
