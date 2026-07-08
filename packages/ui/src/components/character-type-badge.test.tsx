import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { characterTypeEnum } from "@repo/services/schemas/character";

import { CharacterTypeBadge } from "./character-type-badge";

const EXPECTED_LABEL: Record<
  (typeof characterTypeEnum.options)[number],
  string
> = {
  human: "Human",
  animal: "Animal",
  mythological: "Mythological",
  fictional: "Fictional",
  organization: "Organization",
  divine: "Divine",
  artifact: "Artifact",
};

describe("CharacterTypeBadge", () => {
  it.each(characterTypeEnum.options)(
    "renders the icon, token tint, and literal label for %s",
    (type) => {
      render(<CharacterTypeBadge type={type} data-testid="badge" />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveTextContent(EXPECTED_LABEL[type]);
      expect(badge.className).toContain(`text-type-${type}`);
      expect(badge.querySelector("svg")).not.toBeNull();
    },
  );

  it("carries meaning in the label, not the icon (icon is aria-hidden)", () => {
    render(<CharacterTypeBadge type="human" data-testid="badge" />);

    const badge = screen.getByTestId("badge");
    // The literal label is the text the badge exposes — never icon-alone.
    expect(badge.textContent).toBe("Human");

    const icon = badge.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden");
  });

  it("uses a custom label when provided", () => {
    render(
      <CharacterTypeBadge
        type="human"
        label="Protagonist"
        data-testid="badge"
      />,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveTextContent("Protagonist");
    expect(badge).not.toHaveTextContent("Human");
  });
});
