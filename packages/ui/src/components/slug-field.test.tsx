import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SlugField } from "./slug-field";

function SlugFieldHarness() {
  const [source, setSource] = useState("Great Title");
  const [slug, setSlug] = useState("");

  return (
    <>
      <input
        aria-label="Source title"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />
      <SlugField
        value={slug}
        onChange={setSlug}
        sourceValue={source}
        existingSlugs={["great-title"]}
        debounceMs={0}
      />
    </>
  );
}

describe("SlugField", () => {
  it("auto-generates and resolves collisions in create mode", async () => {
    const user = userEvent.setup();
    render(<SlugFieldHarness />);

    const slugInput = screen.getByLabelText("Slug");
    await waitFor(() => expect(slugInput).toHaveValue("great-title-2"));

    await user.clear(slugInput);
    await user.type(slugInput, "manual-slug");
    expect(slugInput).toHaveValue("manual-slug");

    await user.clear(screen.getByLabelText("Source title"));
    await user.type(screen.getByLabelText("Source title"), "Another Title");
    expect(slugInput).toHaveValue("manual-slug");

    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    await waitFor(() => expect(slugInput).toHaveValue("another-title"));
  });

  it("starts locked in edit mode until unlocked", async () => {
    const user = userEvent.setup();

    render(
      <SlugField
        mode="edit"
        value="existing-slug"
        onChange={() => {}}
        sourceValue="Existing title"
      />,
    );

    const slugInput = screen.getByLabelText("Slug");
    expect(slugInput).toHaveAttribute("readonly");

    await user.click(screen.getByRole("button", { name: "Edit slug" }));
    expect(slugInput).not.toHaveAttribute("readonly");
  });
});
