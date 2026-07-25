import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TimelineRenderer } from "./timeline-renderer";
import type { TimelineEventDatum } from "./types";

afterEach(cleanup);

const EVENTS: TimelineEventDatum[] = [
  {
    id: "big-bang",
    label: "Big Bang",
    sortYears: -13.8e9,
    eventType: "milestone",
    eraCode: "BYA",
    displayValue: "13.8 BYA",
  },
  {
    id: "dinos",
    label: "Dinosaurs end",
    sortYears: -66e6,
    eventType: "destruction",
    eraCode: "MYA",
    displayValue: "66 MYA",
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

/** Parse the x from a `translate(x, y)` transform attribute. */
function markerX(el: Element): number {
  const t = el.getAttribute("transform") ?? "";
  const m = /translate\(([-\d.]+)/.exec(t);
  return m ? Number(m[1]) : Number.NaN;
}

function renderWithWidth(
  props: Partial<React.ComponentProps<typeof TimelineRenderer>> = {},
) {
  return render(<TimelineRenderer events={EVENTS} width={800} {...props} />);
}

describe("TimelineRenderer", () => {
  it("renders one focusable marker per event with an accessible name", () => {
    renderWithWidth();
    const markers = screen.getAllByTestId("timeline-marker");
    expect(markers).toHaveLength(EVENTS.length);
    for (const m of markers) {
      expect(m).toHaveAttribute("role", "button");
      expect(m).toHaveAttribute("tabindex", "0");
    }
    // Era code + label both present (never colour alone).
    expect(screen.getByLabelText("13.8 BYA, Big Bang")).toBeInTheDocument();
  });

  it("exposes the axis as a labelled, described group", () => {
    renderWithWidth({ ariaLabel: "Cosmic history" });
    const group = screen.getByRole("group", { name: "Cosmic history" });
    expect(group).toHaveAttribute("aria-describedby");
  });

  it("positions older events left of younger ones (log)", () => {
    renderWithWidth({ scale: "log" });
    const [oldest, , newest] = screen.getAllByTestId("timeline-marker");
    expect(markerX(oldest!)).toBeLessThan(markerX(newest!));
  });

  it("fires the hover contract on enter/leave and focus/blur", () => {
    const onMarkerHover = vi.fn();
    renderWithWidth({ onMarkerHover });
    const marker = screen.getByLabelText("66 MYA, Dinosaurs end");

    fireEvent.mouseEnter(marker);
    expect(onMarkerHover).toHaveBeenLastCalledWith("dinos");
    fireEvent.mouseLeave(marker);
    expect(onMarkerHover).toHaveBeenLastCalledWith(null);

    fireEvent.focus(marker);
    expect(onMarkerHover).toHaveBeenLastCalledWith("dinos");
    fireEvent.blur(marker);
    expect(onMarkerHover).toHaveBeenLastCalledWith(null);
  });

  it("shows a visible value label for the active marker", () => {
    renderWithWidth();
    const marker = screen.getByLabelText("66 MYA, Dinosaurs end");
    fireEvent.mouseEnter(marker);
    // The value appears as visible <text> in addition to the SR <title>.
    expect(screen.getAllByText("66 MYA").length).toBeGreaterThan(0);
  });

  it("fires the activate contract on click, Enter, and Space", () => {
    const onMarkerActivate = vi.fn();
    renderWithWidth({ onMarkerActivate });
    const marker = screen.getByLabelText("2026 CE, Today");

    fireEvent.click(marker);
    fireEvent.keyDown(marker, { key: "Enter" });
    fireEvent.keyDown(marker, { key: " " });
    expect(onMarkerActivate).toHaveBeenCalledTimes(3);
    expect(onMarkerActivate).toHaveBeenCalledWith("today");
  });

  it("ignores non-activating keys", () => {
    const onMarkerActivate = vi.fn();
    renderWithWidth({ onMarkerActivate });
    fireEvent.keyDown(screen.getByLabelText("2026 CE, Today"), { key: "a" });
    expect(onMarkerActivate).not.toHaveBeenCalled();
  });

  it("reflects the scale in the screen-reader description", () => {
    const { rerender } = renderWithWidth({ scale: "linear" });
    expect(screen.getByText(/linear time axis/i)).toBeInTheDocument();
    rerender(<TimelineRenderer events={EVENTS} width={800} scale="log" />);
    expect(screen.getByText(/logarithmic time axis/i)).toBeInTheDocument();
  });

  it("falls back gracefully for an unknown era code", () => {
    render(
      <TimelineRenderer
        width={800}
        events={[
          {
            id: "x",
            label: "Mystery",
            sortYears: 0,
            eventType: "milestone",
            eraCode: "ZZZ",
            displayValue: "?",
          },
        ]}
      />,
    );
    expect(screen.getByTestId("timeline-marker")).toBeInTheDocument();
  });

  it("renders the axis with no markers for an empty event set", () => {
    render(<TimelineRenderer events={[]} width={800} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.queryAllByTestId("timeline-marker")).toHaveLength(0);
  });

  it("omits the SVG until a usable width is known", () => {
    // No explicit width + the no-op ResizeObserver stub ⇒ measured width 0.
    render(<TimelineRenderer events={EVENTS} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    // The SR help hint still renders so the region is announced.
    expect(
      screen.getByText(/use tab to move between event markers/i),
    ).toBeInTheDocument();
  });

  it("measures its container and cleans up the observer on unmount", () => {
    const disconnect = vi.fn();
    const observe = vi.fn();
    class MockRO {
      constructor(private cb: ResizeObserverCallback) {}
      observe = (el: Element) => {
        observe(el);
        this.cb(
          [{ contentRect: { width: 640 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      };
      unobserve = vi.fn();
      disconnect = disconnect;
    }
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockRO as unknown as typeof ResizeObserver;
    try {
      const { unmount } = render(<TimelineRenderer events={EVENTS} />);
      expect(observe).toHaveBeenCalled();
      // With a measured width the axis now renders.
      expect(screen.getByRole("group")).toBeInTheDocument();
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it("renders era-labelled axis ticks", () => {
    renderWithWidth();
    const ticks = screen.getAllByTestId("timeline-tick");
    expect(ticks.length).toBeGreaterThan(0);
    // Ticks are decorative chrome, hidden from the a11y tree.
    for (const t of ticks) expect(t).toHaveAttribute("aria-hidden");
  });

  it("shows more axis ticks as the axis widens", () => {
    const { rerender } = render(
      <TimelineRenderer events={EVENTS} width={320} />,
    );
    const narrow = screen.getAllByTestId("timeline-tick").length;
    rerender(<TimelineRenderer events={EVENTS} width={1600} />);
    const wide = screen.getAllByTestId("timeline-tick").length;
    expect(wide).toBeGreaterThan(narrow);
  });

  it("labels axis ticks across the BCE/CE boundary", () => {
    render(
      <TimelineRenderer
        width={1000}
        scale="linear"
        events={[
          {
            id: "a",
            label: "Founding",
            sortYears: -2000,
            eventType: "milestone",
            eraCode: "BCE",
            displayValue: "2000 BCE",
          },
          {
            id: "b",
            label: "Now",
            sortYears: 2000,
            eventType: "milestone",
            eraCode: "CE",
            displayValue: "2000 CE",
          },
        ]}
      />,
    );
    const labels = screen
      .getAllByTestId("timeline-tick")
      .map((t) => t.textContent ?? "");
    expect(labels.some((l) => l.endsWith("BCE"))).toBe(true);
    expect(labels.some((l) => l.endsWith(" CE"))).toBe(true);
    // No tick at the non-existent year zero.
    expect(labels.some((l) => l === "0 CE" || l === "0 BCE")).toBe(false);
  });
});
