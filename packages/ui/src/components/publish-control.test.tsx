import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PublishControl } from "./publish-control";

describe("PublishControl", () => {
  it("shows a draft badge and a Publish button when unpublished", () => {
    render(<PublishControl published={false} />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("shows a published badge and an Unpublish button when published", () => {
    render(<PublishControl published />);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unpublish" }),
    ).toBeInTheDocument();
  });

  it("confirms before publishing", async () => {
    const onPublish = vi.fn();
    const user = userEvent.setup();
    render(
      <PublishControl
        published={false}
        entityLabel="timeline"
        onPublish={onPublish}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // Confirm inside the dialog (scoped so we don't hit the trigger button).
    await user.click(within(dialog).getByRole("button", { name: "Publish" }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("hides the action button for viewers", () => {
    render(<PublishControl published canPublish={false} />);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unpublish" }),
    ).not.toBeInTheDocument();
  });
});
