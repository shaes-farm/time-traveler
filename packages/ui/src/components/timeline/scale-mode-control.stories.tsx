import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ViewMode } from "@repo/ui/stores";
import { ScaleModeControl } from "./scale-mode-control";
import { CompressionHint } from "./compression-hint";
import { TimelineRenderer } from "./timeline-renderer";
import { domainFromSortYears } from "./timeline-scale";
import { toScaleMode } from "./scale-mode";
import type { TimelineEventDatum } from "./types";

/** Big-Bang-to-today exemplars — a cosmological span that linear mode compresses. */
const DEEP_TIME_EVENTS: TimelineEventDatum[] = [
  {
    id: "big-bang",
    label: "Big Bang",
    sortYears: -13.8e9,
    eventType: "milestone",
    eraCode: "BYA",
    displayValue: "13.8 BYA",
  },
  {
    id: "first-life",
    label: "First life",
    sortYears: -3.5e9,
    eventType: "milestone",
    eraCode: "BYA",
    displayValue: "3.5 BYA",
  },
  {
    id: "cambrian",
    label: "Cambrian explosion",
    sortYears: -538e6,
    eventType: "transformation",
    eraCode: "MYA",
    displayValue: "538 MYA",
  },
  {
    id: "first-humans",
    label: "First humans",
    sortYears: -300e3,
    eventType: "milestone",
    eraCode: "KYA",
    displayValue: "300 KYA",
  },
  {
    id: "pyramid",
    label: "Great Pyramid",
    sortYears: -2560,
    eventType: "creation",
    eraCode: "BCE",
    displayValue: "2560 BCE",
  },
  {
    id: "moon",
    label: "Moon landing",
    sortYears: 1969,
    eventType: "milestone",
    eraCode: "CE",
    displayValue: "1969 CE",
  },
  {
    id: "today",
    label: "Today",
    sortYears: 2026,
    eventType: "milestone",
    eraCode: "CE",
    displayValue: "2026 CE",
  },
];

/** A recent (sub-megayear) span that never trips the compression hint. */
const RECENT_EVENTS: TimelineEventDatum[] = [
  {
    id: "rome",
    label: "Rome founded",
    sortYears: -753,
    eventType: "milestone",
    eraCode: "BCE",
    displayValue: "753 BCE",
  },
  {
    id: "printing",
    label: "Printing press",
    sortYears: 1440,
    eventType: "discovery",
    eraCode: "CE",
    displayValue: "1440 CE",
  },
  {
    id: "moon",
    label: "Moon landing",
    sortYears: 1969,
    eventType: "milestone",
    eraCode: "CE",
    displayValue: "1969 CE",
  },
  {
    id: "today",
    label: "Today",
    sortYears: 2026,
    eventType: "milestone",
    eraCode: "CE",
    displayValue: "2026 CE",
  },
];

/**
 * The composed toggle experience (#67): a {@link ScaleModeControl} driving the
 * {@link TimelineRenderer}'s scale, with the {@link CompressionHint} surfacing
 * when linear compresses a long span. State is local here; in the reader it is
 * canonically the `?scale=` query (#261).
 */
function ScaleToggleDemo({ events }: { events: TimelineEventDatum[] }) {
  const [mode, setMode] = useState<ViewMode>("logarithmic");
  const domain = domainFromSortYears(events.map((e) => e.sortYears));

  return (
    <div className="flex flex-col gap-3">
      <ScaleModeControl value={mode} onValueChange={setMode} />
      <CompressionHint
        mode={mode}
        domain={domain}
        onSwitchToLogarithmic={() => setMode("logarithmic")}
      />
      <TimelineRenderer events={events} scale={toScaleMode(mode)} width={960} />
    </div>
  );
}

const meta = {
  title: "Components/ScaleModeControl",
  component: ScaleModeControl,
  parameters: { layout: "padded" },
  args: {
    value: "logarithmic",
    onValueChange: () => {},
  },
  argTypes: {
    value: { control: "inline-radio", options: ["logarithmic", "linear"] },
  },
} satisfies Meta<typeof ScaleModeControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bare control, controlled by the Storybook `value` arg. */
export const Control: Story = {
  render: (args) => (
    <ScaleModeControl
      value={args.value}
      onValueChange={() => {}}
      ariaLabel={args.ariaLabel}
    />
  ),
};

/**
 * Toggling linear on a Big-Bang-to-today span compresses geological events into
 * the recent sliver and surfaces the V-07 hint; switching back to logarithmic
 * (via the control or the hint) restores legibility. Selection/focus survive the
 * swap because the anchor is the mode-agnostic `sortYears`.
 */
export const WithTimeline: Story = {
  render: () => <ScaleToggleDemo events={DEEP_TIME_EVENTS} />,
};

/** A recent span: the control still toggles, but the compression hint never fires. */
export const RecentSpanNoHint: Story = {
  render: () => <ScaleToggleDemo events={RECENT_EVENTS} />,
};
