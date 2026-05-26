import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Typography",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

const Row = ({
  label,
  cssVar,
  fontClass,
  sample,
}: {
  label: string;
  cssVar: string;
  fontClass: string;
  sample: string;
}) => (
  <div className="grid grid-cols-[160px_1fr] items-baseline gap-6 border-b border-border-muted py-4">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-foreground">{label}</span>
      <code className="font-mono text-xs text-foreground-muted">{cssVar}</code>
    </div>
    <div className={fontClass}>{sample}</div>
  </div>
);

export const Faces: Story = {
  render: () => (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-xl text-foreground">Typefaces</h2>
      <p className="mb-6 text-sm text-foreground-muted">
        Loaded via <code className="font-mono text-xs">next/font</code> in{" "}
        <code className="font-mono text-xs">apps/admin/app/layout.tsx</code> and
        re-bound here for the Storybook canvas via Google Fonts CDN (see{" "}
        <code className="font-mono text-xs">.storybook/preview-fonts.css</code>
        ).
      </p>
      <Row
        label="Display"
        cssVar="--font-display"
        fontClass="font-display text-3xl text-foreground"
        sample="Time Traveler — temporal scholarship"
      />
      <Row
        label="Body"
        cssVar="--font-body"
        fontClass="font-body text-base text-foreground"
        sample="Marie Curie was born 1867 CE in Warsaw, Poland."
      />
      <Row
        label="Mono"
        cssVar="--font-mono"
        fontClass="font-mono text-sm text-foreground"
        sample="curie-marie-1867 · 0142 · 0xDEADBEEF"
      />
    </div>
  ),
};

const ScaleRow = ({
  label,
  className,
}: {
  label: string;
  className: string;
}) => (
  <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-border-muted py-3">
    <code className="font-mono text-xs text-foreground-muted">{label}</code>
    <span className={`${className} text-foreground`}>
      Era + precision visible everywhere a date appears.
    </span>
  </div>
);

export const Scale: Story = {
  render: () => (
    <div>
      <h2 className="mb-4 font-display text-xl text-foreground">
        Body scale (Tailwind defaults)
      </h2>
      <ScaleRow label="text-xs (12px)" className="font-body text-xs" />
      <ScaleRow label="text-sm (14px)" className="font-body text-sm" />
      <ScaleRow label="text-base (16px)" className="font-body text-base" />
      <ScaleRow label="text-lg (18px)" className="font-body text-lg" />
      <ScaleRow label="text-xl (20px)" className="font-body text-xl" />
      <ScaleRow label="text-2xl (24px)" className="font-body text-2xl" />
      <ScaleRow label="text-3xl (30px)" className="font-display text-3xl" />
      <ScaleRow label="text-4xl (36px)" className="font-display text-4xl" />
    </div>
  ),
};

const tabularRows = [
  { year: 1867, importance: 9, era: "CE" },
  { year: 1903, importance: 10, era: "CE" },
  { year: 12000, importance: 7, era: "BCE" },
  { year: 200000, importance: 6, era: "KYA" },
  { year: 4500000000, importance: 4, era: "BYA" },
];

export const TabularFigures: Story = {
  render: () => (
    <div>
      <h2 className="mb-2 font-display text-xl text-foreground">
        Tabular figures
      </h2>
      <p className="mb-4 text-sm text-foreground-muted">
        Body font must align numbers in tables.{" "}
        <code className="font-mono text-xs">
          font-feature-settings: &quot;tnum&quot;
        </code>{" "}
        is set globally in{" "}
        <code className="font-mono text-xs">globals.css</code>; rows below
        should align cleanly across each column at every text size.
      </p>
      <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-base text-foreground">
        <div className="text-foreground-subtle">Year</div>
        <div className="text-foreground-subtle">Era</div>
        <div className="text-right text-foreground-subtle">Importance</div>
        {tabularRows.map((r) => (
          <div key={`${r.era}-${r.year}`} className="contents">
            <div className="font-mono">{r.year}</div>
            <div>{r.era}</div>
            <div className="text-right font-mono">{r.importance}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};
