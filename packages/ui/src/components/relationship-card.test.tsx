import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TemporalData } from "@repo/services/schemas/temporal";

import { RelationshipCard } from "./relationship-card";

const T = (
  data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">,
): TemporalData => ({ precision: "exact", ...data });

const baseProps = {
  otherCharacter: {
    name: "Pierre Curie",
    slug: "pierre-curie",
    characterType: "human",
    initials: "PC",
  },
  relationshipType: "family",
};

describe("RelationshipCard", () => {
  it("renders the other character's name and type label", () => {
    render(
      <RelationshipCard
        {...baseProps}
        startTemporal={T({ year: 1895, era: "CE" })}
      />,
    );

    expect(screen.getByText("Pierre Curie")).toBeInTheDocument();
    // type label is humanized + capitalized via Tailwind
    expect(screen.getByText("family")).toBeInTheDocument();
  });

  it("renders the sub-role badge when relationshipRole is set", () => {
    render(<RelationshipCard {...baseProps} relationshipRole="spouse" />);
    expect(
      screen.getByTestId("relationship-card-role-badge"),
    ).toBeInTheDocument();
    expect(screen.getByText("spouse")).toBeInTheDocument();
  });

  it("omits the sub-role badge when relationshipRole is null", () => {
    render(<RelationshipCard {...baseProps} />);
    expect(
      screen.queryByTestId("relationship-card-role-badge"),
    ).not.toBeInTheDocument();
  });

  it("calls action handlers from the dropdown menu", async () => {
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <RelationshipCard
        {...baseProps}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("shows the contradiction Alert when the prop is set", () => {
    render(
      <RelationshipCard
        {...baseProps}
        contradiction="Pierre is also recorded as your spouse."
      />,
    );
    expect(
      screen.getByTestId("relationship-card-contradiction"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/also recorded as your spouse/i),
    ).toBeInTheDocument();
  });

  it("shows the Synced badge when isReciprocal is true", () => {
    render(<RelationshipCard {...baseProps} isReciprocal />);
    expect(
      screen.getByTestId("relationship-card-synced-badge"),
    ).toBeInTheDocument();
  });

  it("renders an 'ongoing or unknown' placeholder when no temporal data is set", () => {
    render(<RelationshipCard {...baseProps} />);
    expect(screen.getByText(/ongoing or unknown/i)).toBeInTheDocument();
  });

  it("renders direction label and description when provided", () => {
    render(
      <RelationshipCard
        {...baseProps}
        directionLabel="Marie is spouse of Pierre"
        description="A long-standing personal and professional partnership."
      />,
    );

    expect(screen.getByText(/marie is spouse of pierre/i)).toBeInTheDocument();
    expect(
      screen.getByText(/long-standing personal and professional partnership/i),
    ).toBeInTheDocument();
  });

  it("renders temporal span when only endTemporal is provided", () => {
    render(
      <RelationshipCard
        {...baseProps}
        endTemporal={T({ year: 1906, era: "CE" })}
      />,
    );

    expect(screen.getByLabelText("1906 CE")).toBeInTheDocument();
  });

  it("calls duplicate and delete actions and renders separator when duplicate+delete are present", async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();

    render(
      <RelationshipCard
        {...baseProps}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    expect(screen.getByRole("separator")).toBeInTheDocument();

    await user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render separator when only delete action exists", async () => {
    const user = userEvent.setup();

    render(<RelationshipCard {...baseProps} onDelete={() => {}} />);

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("renders separator when edit and delete actions both exist", async () => {
    const user = userEvent.setup();

    render(
      <RelationshipCard {...baseProps} onEdit={() => {}} onDelete={() => {}} />,
    );

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    expect(await screen.findByRole("separator")).toBeInTheDocument();
  });
});
