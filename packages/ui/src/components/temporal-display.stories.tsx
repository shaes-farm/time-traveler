import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TemporalData } from "@repo/services/schemas/temporal.js";
import { TemporalDisplay } from "./temporal-display";

const meta = {
  title: "Components/TemporalDisplay",
  component: TemporalDisplay,
  parameters: { layout: "centered" },
  argTypes: {
    format: {
      control: "select",
      options: ["inline", "block", "compact"],
    },
    showExact: { control: "boolean" },
  },
} satisfies Meta<typeof TemporalDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const T = (data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">) =>
  ({
    precision: "exact",
    ...data,
  }) as TemporalData;

// ─────────────────────────────────────────────────────────────────────
// Single-era exemplars (CE/BCE/KYA/MYA/BYA × exact/circa/approximate)
// ─────────────────────────────────────────────────────────────────────

export const CommonEraExact: Story = {
  args: {
    value: T({ year: 1867, era: "CE", month: 11, day: 7, precision: "exact" }),
  },
};

export const CommonEraExactShown: Story = {
  args: {
    value: T({ year: 1867, era: "CE", month: 11, day: 7, precision: "exact" }),
    showExact: true,
  },
};

export const CommonEraCirca: Story = {
  args: {
    value: T({ year: 1867, era: "CE", precision: "circa" }),
  },
};

export const BeforeCommonEra: Story = {
  args: {
    value: T({ year: 44, era: "BCE", month: 3, day: 15, precision: "exact" }),
  },
};

export const ThousandYearsAgo: Story = {
  args: {
    value: T({ year: 12, era: "KYA", precision: "approximate" }),
  },
};

export const MillionYearsAgo: Story = {
  args: {
    value: T({
      year: 66,
      era: "MYA",
      precision: "approximate",
      uncertainty: 500_000,
    }),
  },
};

export const BillionYearsAgo: Story = {
  args: {
    value: T({
      year: 4,
      era: "BYA",
      precision: "estimated",
      uncertainty: 200_000_000,
    }),
  },
};

// ─────────────────────────────────────────────────────────────────────
// Geological + cosmological
// ─────────────────────────────────────────────────────────────────────

export const GeologicalBoundary: Story = {
  args: {
    value: T({
      year: 66,
      era: "MYA",
      precision: "geological",
      geological_period: "Cretaceous-Paleogene boundary",
    }),
  },
};

export const CosmologicalEpoch: Story = {
  args: {
    value: T({
      year: 14,
      era: "BYA",
      precision: "approximate",
      display_format: "cosmological",
      cosmological_epoch: "Big Bang",
    }),
  },
};

// ─────────────────────────────────────────────────────────────────────
// Format variants
// ─────────────────────────────────────────────────────────────────────

export const InlineFormat: Story = {
  args: {
    value: T({ year: 1867, era: "CE", precision: "circa" }),
    format: "inline",
  },
};

export const BlockFormat: Story = {
  args: {
    value: T({ year: 1867, era: "CE", precision: "circa" }),
    format: "block",
  },
};

export const CompactFormat: Story = {
  args: {
    value: T({ year: 1867, era: "CE", precision: "circa" }),
    format: "compact",
  },
};

// ─────────────────────────────────────────────────────────────────────
// Range + range-bar triggers
// ─────────────────────────────────────────────────────────────────────

export const RangeSameEra: Story = {
  args: {
    value: T({ year: 1867, era: "CE", precision: "exact" }),
    endValue: T({ year: 1934, era: "CE", precision: "exact" }),
  },
};

export const RangeOverThousandYears: Story = {
  args: {
    value: T({ year: 800, era: "CE", precision: "approximate" }),
    endValue: T({ year: 2500, era: "CE", precision: "approximate" }),
  },
};

export const RangeCrossesEraBoundary: Story = {
  args: {
    value: T({ year: 44, era: "BCE", precision: "approximate" }),
    endValue: T({ year: 120, era: "CE", precision: "approximate" }),
  },
};

export const RangePointWithUncertainty: Story = {
  args: {
    value: T({
      year: 66,
      era: "MYA",
      precision: "approximate",
      uncertainty: 1_000_000,
    }),
  },
};

// ─────────────────────────────────────────────────────────────────────
// Variant matrix — every era at every precision, all in one screen
// ─────────────────────────────────────────────────────────────────────

const eras = ["CE", "BCE", "KYA", "MYA", "BYA"] as const;
const precisions = ["exact", "circa", "approximate", "estimated"] as const;
const sampleYear = { CE: 1867, BCE: 44, KYA: 12, MYA: 66, BYA: 4 } as const;

export const Matrix: Story = {
  args: { value: T({ year: 1867, era: "CE" }) }, // unused; render overrides
  render: () => (
    <div className="grid grid-cols-[80px_repeat(4,1fr)] gap-x-6 gap-y-3 p-4">
      <div className="text-xs text-foreground-subtle">Era</div>
      {precisions.map((p) => (
        <div key={p} className="text-xs text-foreground-subtle capitalize">
          {p}
        </div>
      ))}
      {eras.map((era) => (
        <div key={era} className="contents">
          <div className="font-mono text-xs text-foreground-muted">{era}</div>
          {precisions.map((precision) => (
            <div key={`${era}-${precision}`}>
              <TemporalDisplay
                value={T({ year: sampleYear[era], era, precision })}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
