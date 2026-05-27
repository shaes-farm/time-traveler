import type { Meta, StoryObj } from "@storybook/react-vite";
import { colors } from "./tokens";

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

const eraSwatches: Swatch[] = [
  {
    cssVar: "--color-era-ce",
    tsName: "eraCe",
    oklch: colors.eraCe,
    role: "TemporalDisplay — CE era code",
  },
  {
    cssVar: "--color-era-bce",
    tsName: "eraBce",
    oklch: colors.eraBce,
    role: "TemporalDisplay — BCE era code",
  },
  {
    cssVar: "--color-era-kya",
    tsName: "eraKya",
    oklch: colors.eraKya,
    role: "TemporalDisplay — KYA era code",
  },
  {
    cssVar: "--color-era-mya",
    tsName: "eraMya",
    oklch: colors.eraMya,
    role: "TemporalDisplay — MYA era code",
  },
  {
    cssVar: "--color-era-bya",
    tsName: "eraBya",
    oklch: colors.eraBya,
    role: "TemporalDisplay — BYA era code",
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
      <div>
        <h3 className="mb-2 font-display text-base text-foreground">
          Era accents (Batch E)
        </h3>
        <p className="mb-3 text-sm text-foreground-muted">
          Hues spread across the wheel with consistent lightness. The
          TemporalDisplay primitive pairs each hue with a mono typographic
          accent so colorblind users still see the era distinction.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {eraSwatches.map((swatch) => (
            <SwatchCard key={swatch.cssVar} swatch={swatch} />
          ))}
        </div>
      </div>
      <div className="rounded-md border border-border bg-surface p-4">
        <h3 className="mb-2 font-display text-base text-foreground">
          Remaining accent slots
        </h3>
        <p className="text-sm text-foreground-muted">
          Importance gradient (1–10) is intentionally unfilled until Batch F
          (list primitives) consumes it. See{" "}
          <code className="font-mono text-xs">
            docs/design/admin/fidelity-2-plan.md
          </code>
          .
        </p>
      </div>
    </div>
  ),
};
