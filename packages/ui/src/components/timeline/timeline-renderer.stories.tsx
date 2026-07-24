import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimelineRenderer } from "./timeline-renderer";
import type { TimelineEventDatum } from "./types";

/**
 * A canonical Big-Bang-to-today set, mirroring the landing strip's exemplars.
 * `sortYears` follows the `sort_order_years` contract (CE positive,
 * prehistoric large-negative).
 */
const SEED_EVENTS: TimelineEventDatum[] = [
  {
    id: "big-bang",
    label: "Big Bang",
    sortYears: -13.8e9,
    eventType: "milestone",
    eraCode: "BYA",
    displayValue: "13.8 BYA",
  },
  {
    id: "earth-forms",
    label: "Earth forms",
    sortYears: -4.54e9,
    eventType: "creation",
    eraCode: "BYA",
    displayValue: "4.54 BYA",
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
    id: "dinos-end",
    label: "Dinosaurs end",
    sortYears: -66e6,
    eventType: "destruction",
    eraCode: "MYA",
    displayValue: "66 MYA",
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
    id: "agriculture",
    label: "Agriculture begins",
    sortYears: -10e3,
    eventType: "discovery",
    eraCode: "KYA",
    displayValue: "10 KYA",
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
    id: "rome",
    label: "Roman Empire",
    sortYears: -27,
    eventType: "milestone",
    eraCode: "BCE",
    displayValue: "27 BCE",
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
 * A ~127-event synthetic set (PRD §5854 typical-timeline size) for eyeballing
 * the documented performance baseline. See `timeline-renderer.perf.md` — the
 * seeded set renders well under the PRD's <100ms budget for <100 events and the
 * <500ms budget at this size.
 */
const PERF_EVENTS: TimelineEventDatum[] = Array.from(
  { length: 127 },
  (_, i) => {
    const sortYears = Math.round(-13.8e9 * Math.pow(1 - i / 127, 6));
    return {
      id: `perf-${i}`,
      label: `Event ${i}`,
      sortYears,
      eventType: "milestone",
      eraCode:
        sortYears < -1e9
          ? "BYA"
          : sortYears < -1e6
            ? "MYA"
            : sortYears < -1e3
              ? "KYA"
              : "CE",
      displayValue: `${sortYears}`,
    };
  },
);

const meta = {
  title: "Components/TimelineRenderer",
  component: TimelineRenderer,
  parameters: { layout: "padded" },
  argTypes: {
    scale: { control: "inline-radio", options: ["log", "linear"] },
  },
  args: {
    events: SEED_EVENTS,
    scale: "log",
  },
} satisfies Meta<typeof TimelineRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logarithmic: Story = {};

export const Linear: Story = {
  args: { scale: "linear" },
};

export const PerformanceBaseline: Story = {
  args: { events: PERF_EVENTS },
};
