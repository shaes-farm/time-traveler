import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { TemporalDisplay } from "./temporal-display";

const T = (data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">) =>
  ({ precision: "exact", ...data }) as TemporalData;

describe("TemporalDisplay", () => {
  it("renders the date with era code", () => {
    const { container } = render(
      <TemporalDisplay value={T({ year: 1867, era: "CE" })} />,
    );
    expect(container.textContent).toContain("1867");
    expect(container.textContent).toContain("CE");
  });

  it("suppresses (exact) modifier by default", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE", precision: "exact" })}
      />,
    );
    expect(container.textContent).not.toContain("exact");
  });

  it("renders (exact) when showExact is true", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE", precision: "exact" })}
        showExact
      />,
    );
    expect(container.textContent).toContain("(exact)");
  });

  it("renders the precision modifier for non-exact precisions", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE", precision: "circa" })}
      />,
    );
    expect(container.textContent).toContain("(circa)");
  });

  it("renders the uncertainty inline in era units", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({
          year: 66,
          era: "MYA",
          precision: "approximate",
          uncertainty: 500_000,
        })}
      />,
    );
    expect(container.textContent).toContain("± 0.5M");
  });

  it("renders month + day for sub-year CE precision", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE", month: 11, day: 7 })}
      />,
    );
    expect(container.textContent).toContain("November 7, 1867");
  });

  it("collapses range era to a single trailing code when both sides match", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE" })}
        endValue={T({ year: 1934, era: "CE" })}
      />,
    );
    // Era should appear once, not twice
    const eraMatches = container.textContent?.match(/CE/g) ?? [];
    expect(eraMatches.length).toBe(1);
    expect(container.textContent).toContain("1867");
    expect(container.textContent).toContain("1934");
  });

  it("keeps both era codes when range crosses an era boundary", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({ year: 12, era: "KYA", precision: "approximate" })}
        endValue={T({ year: 8, era: "BCE", precision: "approximate" })}
      />,
    );
    expect(container.textContent).toContain("KYA");
    expect(container.textContent).toContain("BCE");
  });

  it("uses TemporalService.formatDisplay for the aria-label", () => {
    render(
      <TemporalDisplay
        value={T({ year: 1867, era: "CE", month: 11, day: 7 })}
        data-testid="td"
      />,
    );
    // formatStandard returns "November 7, 1867 CE"
    expect(screen.getByLabelText(/November 7, 1867 CE/)).toBeInTheDocument();
  });

  it("defers to formatDisplay for geological precision", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({
          year: 66,
          era: "MYA",
          precision: "geological",
          geological_period: "Cretaceous-Paleogene boundary",
        })}
      />,
    );
    expect(container.textContent).toContain("Cretaceous-Paleogene boundary");
    expect(container.textContent).toContain("MYA");
  });

  it("defers to formatDisplay for cosmological format", () => {
    const { container } = render(
      <TemporalDisplay
        value={T({
          year: 14,
          era: "BYA",
          precision: "approximate",
          display_format: "cosmological",
          cosmological_epoch: "Big Bang",
        })}
      />,
    );
    expect(container.textContent).toContain("Big Bang");
    expect(container.textContent).toContain("BYA");
  });

  describe("range-bar trigger", () => {
    const findBar = (container: HTMLElement) =>
      container.querySelector("[aria-hidden][style]");

    it("hides the bar for trivial CE ranges (< 1000 yr, no uncertainty)", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 1867, era: "CE" })}
          endValue={T({ year: 1934, era: "CE" })}
        />,
      );
      expect(findBar(container)).toBeNull();
    });

    it("shows the bar when range spans > 1000 yr", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 800, era: "CE", precision: "approximate" })}
          endValue={T({ year: 2000, era: "CE", precision: "approximate" })}
        />,
      );
      expect(findBar(container)).not.toBeNull();
    });

    it("shows the bar when range crosses an era boundary", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 100, era: "BCE", precision: "approximate" })}
          endValue={T({ year: 100, era: "CE", precision: "approximate" })}
        />,
      );
      expect(findBar(container)).not.toBeNull();
    });

    it("shows the bar when uncertainty > 100 yr on a single point", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({
            year: 12,
            era: "KYA",
            precision: "approximate",
            uncertainty: 500,
          })}
        />,
      );
      expect(findBar(container)).not.toBeNull();
    });

    it("hides the bar when uncertainty <= 100 yr and no range", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({
            year: 1867,
            era: "CE",
            precision: "circa",
            uncertainty: 50,
          })}
        />,
      );
      expect(findBar(container)).toBeNull();
    });
  });

  describe("format variants", () => {
    it("inline renders date + era on a single line", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 1867, era: "CE", precision: "circa" })}
          format="inline"
        />,
      );
      expect(container.textContent).toMatch(/1867\s+CE\s+\(circa\)/);
    });

    it("block stacks era + precision below the year", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 1867, era: "CE", precision: "circa" })}
          format="block"
        />,
      );
      const flexCols = container.querySelectorAll(".flex-col");
      expect(flexCols.length).toBeGreaterThan(0);
    });

    it("compact suppresses the precision modifier", () => {
      const { container } = render(
        <TemporalDisplay
          value={T({ year: 1867, era: "CE", precision: "circa" })}
          format="compact"
        />,
      );
      expect(container.textContent).toContain("1867");
      expect(container.textContent).toContain("CE");
      expect(container.textContent).not.toContain("(circa)");
    });
  });
});
