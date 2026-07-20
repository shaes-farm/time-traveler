import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  EraTimelineStrip,
  computeLogBands,
  computeMarkerLeft,
} from "./era-timeline-strip";

describe("computeMarkerLeft", () => {
  it("pins the Big Bang to the left pad on both scales", () => {
    expect(computeMarkerLeft("log", 13.8e9)).toBeCloseTo(7);
    expect(computeMarkerLeft("linear", 13.8e9)).toBeCloseTo(7);
  });

  it("pins the present to the right edge of the span", () => {
    expect(computeMarkerLeft("log", 1)).toBeCloseTo(92);
    expect(computeMarkerLeft("linear", 1)).toBeCloseTo(92, 1);
  });

  it("clamps yearsAgo below 1 instead of diverging", () => {
    expect(computeMarkerLeft("log", 0)).toBeCloseTo(92);
    expect(computeMarkerLeft("linear", -5)).toBeCloseTo(92, 1);
  });

  it("spreads deep time on the log scale but crushes it on linear", () => {
    const logPyramid = computeMarkerLeft("log", 4586);
    const linearPyramid = computeMarkerLeft("linear", 4586);
    // Log keeps the pyramid visibly left of Today; linear pins it to the edge.
    expect(92 - logPyramid).toBeGreaterThan(20);
    expect(92 - linearPyramid).toBeLessThan(0.01);
  });

  it("orders markers oldest→newest left→right", () => {
    const ages = [13.8e9, 4.54e9, 66e6, 3e5, 4586, 1];
    for (const scale of ["log", "linear"] as const) {
      const lefts = ages.map((ya) => computeMarkerLeft(scale, ya));
      expect([...lefts].sort((a, b) => a - b)).toEqual(lefts);
    }
  });
});

describe("computeLogBands", () => {
  it("tiles the four era bands contiguously across the axis", () => {
    const bands = computeLogBands();
    expect(bands.map((b) => b.code)).toEqual(["BYA", "MYA", "KYA", "CE / BCE"]);
    expect(bands[0]?.left).toBeCloseTo(7);
    for (let i = 1; i < bands.length; i++) {
      const prev = bands[i - 1];
      const next = bands[i];
      expect(next?.left).toBeCloseTo((prev?.left ?? 0) + (prev?.width ?? 0));
    }
    const last = bands[bands.length - 1];
    expect((last?.left ?? 0) + (last?.width ?? 0)).toBeCloseTo(92);
  });
});

describe("EraTimelineStrip", () => {
  it("renders the six canonical markers with paired name and era value", () => {
    render(<EraTimelineStrip />);
    for (const [name, value] of [
      ["Big Bang", "13.8 BYA"],
      ["Earth forms", "4.54 BYA"],
      ["Dinosaurs end", "66 MYA"],
      ["First humans", "300 KYA"],
      ["Great Pyramid", "2560 BCE"],
      ["Today", "2026 CE"],
    ]) {
      expect(screen.getByText(name as string)).toBeInTheDocument();
      expect(screen.getByText(value as string)).toBeInTheDocument();
    }
  });

  it("defaults to log scale: bands visible, Logarithmic pressed, log caption", () => {
    render(<EraTimelineStrip />);
    const bands = screen.getByTestId("era-bands");
    expect(within(bands).getByText("BYA")).toBeInTheDocument();
    expect(within(bands).getByText("CE / BCE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logarithmic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Linear" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText(/each step is 10× deeper/i)).toBeInTheDocument();
  });

  it("switches to linear: bands unmount, caption and pressed state flip", async () => {
    const user = userEvent.setup();
    render(<EraTimelineStrip />);
    await user.click(screen.getByRole("button", { name: "Linear" }));
    expect(screen.queryByTestId("era-bands")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Linear" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/crushes every human event/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Logarithmic" }));
    expect(screen.getByTestId("era-bands")).toBeInTheDocument();
  });

  it("exposes the scale toggle as a labelled group", () => {
    render(<EraTimelineStrip />);
    expect(
      screen.getByRole("group", { name: /timeline scale/i }),
    ).toBeInTheDocument();
  });

  it("honors defaultScale=linear", () => {
    render(<EraTimelineStrip defaultScale="linear" />);
    expect(screen.queryByTestId("era-bands")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Linear" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("accepts custom markers, kicker, and captions", () => {
    render(
      <EraTimelineStrip
        markers={[
          {
            name: "Moon forms",
            yearsAgo: 4.5e9,
            era: "BYA",
            value: "4.5 BYA",
            labelPosition: "above",
          },
        ]}
        kicker="All of time"
        captions={{ log: "Log caption", linear: "Linear caption" }}
      />,
    );
    expect(screen.getByText("Moon forms")).toBeInTheDocument();
    expect(screen.queryByText("Big Bang")).not.toBeInTheDocument();
    expect(screen.getByText("All of time")).toBeInTheDocument();
    expect(screen.getByText("Log caption")).toBeInTheDocument();
  });
});
