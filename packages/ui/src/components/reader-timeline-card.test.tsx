import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";
import {
  ReaderTimelineCard,
  type ReaderTimelineCardData,
} from "./reader-timeline-card";

const START: TemporalData = { year: 1969, era: "CE", precision: "exact" };
const END: TemporalData = { year: 1972, era: "CE", precision: "exact" };

const BASE: ReaderTimelineCardData = {
  title: "The Apollo Program",
  summary: "Crewed lunar exploration.",
  temporalData: START,
};

describe("ReaderTimelineCard", () => {
  it("links the title to the given href", () => {
    render(<ReaderTimelineCard timeline={BASE} href="/explore" />);
    const link = screen.getByRole("link", { name: "The Apollo Program" });
    expect(link).toHaveAttribute("href", "/explore");
  });

  it("renders the temporal date via TemporalDisplay", () => {
    render(<ReaderTimelineCard timeline={BASE} href="/explore" />);
    expect(screen.getByText(/1969/)).toBeInTheDocument();
  });

  it("renders the range end when end_temporal_data is supplied", () => {
    render(
      <ReaderTimelineCard
        timeline={{ ...BASE, endTemporalData: END }}
        href="/explore"
      />,
    );
    expect(screen.getByText(/1972/)).toBeInTheDocument();
  });

  it("renders the summary when present and omits it otherwise", () => {
    const { rerender } = render(
      <ReaderTimelineCard timeline={BASE} href="/explore" />,
    );
    expect(screen.getByText("Crewed lunar exploration.")).toBeInTheDocument();

    rerender(
      <ReaderTimelineCard
        timeline={{ ...BASE, summary: null }}
        href="/explore"
      />,
    );
    expect(
      screen.queryByText("Crewed lunar exploration."),
    ).not.toBeInTheDocument();
  });

  it("uses the injected LinkComponent", () => {
    const Custom = ({
      href,
      children,
    }: {
      href: string;
      children?: React.ReactNode;
    }) => (
      <a href={href} data-custom="yes">
        {children}
      </a>
    );
    render(
      <ReaderTimelineCard
        timeline={BASE}
        href="/explore"
        LinkComponent={Custom}
      />,
    );
    expect(
      screen.getByRole("link", { name: "The Apollo Program" }),
    ).toHaveAttribute("data-custom", "yes");
  });
});
