import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReaderContentRail } from "./reader-content-rail";

describe("ReaderContentRail", () => {
  it("renders the heading and labels the section with it", () => {
    render(<ReaderContentRail title="Recent timelines" state="ready" />);
    const section = screen.getByRole("region", { name: "Recent timelines" });
    expect(section).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recent timelines" }),
    ).toBeInTheDocument();
  });

  it("renders skeletonCount placeholders while loading", () => {
    const { container } = render(
      <ReaderContentRail title="Recent" state="loading" skeletonCount={3} />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("renders the empty message in the empty state", () => {
    render(
      <ReaderContentRail
        title="Recent"
        state="empty"
        emptyMessage="No stories yet."
      />,
    );
    expect(screen.getByText("No stories yet.")).toBeInTheDocument();
  });

  it("renders the error message and fires onRetry", async () => {
    const onRetry = vi.fn();
    render(
      <ReaderContentRail
        title="Recent"
        state="error"
        errorMessage="Boom."
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Boom.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders children only in the ready state", () => {
    const { rerender } = render(
      <ReaderContentRail title="Recent" state="loading">
        <div>card</div>
      </ReaderContentRail>,
    );
    expect(screen.queryByText("card")).not.toBeInTheDocument();

    rerender(
      <ReaderContentRail title="Recent" state="ready">
        <div>card</div>
      </ReaderContentRail>,
    );
    expect(screen.getByText("card")).toBeInTheDocument();
  });
});
