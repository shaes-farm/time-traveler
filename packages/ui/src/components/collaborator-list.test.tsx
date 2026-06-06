import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  CollaboratorList,
  type Collaborator,
  type CollaboratorOwner,
  type ResolvedProfile,
} from "./collaborator-list";

const OWNER: CollaboratorOwner = {
  displayName: "Ada Lovelace",
  username: "ada",
};

const OWNER_ID = "owner-1";

const COLLABORATORS: Collaborator[] = [
  {
    id: "user-1",
    username: "irenejc",
    displayName: "Irène Joliot-Curie",
    role: "editor",
  },
];

const NEWBIE: ResolvedProfile = {
  id: "user-2",
  username: "newbie",
  displayName: "New Bie",
};

function renderList(
  props: Partial<React.ComponentProps<typeof CollaboratorList>> = {},
) {
  return render(
    <CollaboratorList
      collaborators={COLLABORATORS}
      owner={OWNER}
      ownerUserId={OWNER_ID}
      {...props}
    />,
  );
}

describe("CollaboratorList", () => {
  it("renders the locked owner section and the collaborator list", () => {
    renderList();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText(/owner · full control/)).toBeInTheDocument();
    // The owner is not a removable row.
    expect(
      screen.queryByRole("button", { name: /Remove Ada Lovelace/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("@irenejc")).toBeInTheDocument();
  });

  it("shows an empty state when there are no collaborators", () => {
    renderList({ collaborators: [] });
    expect(screen.getByText(/No collaborators yet/)).toBeInTheDocument();
  });

  it("resolves a username and adds the resolved user id", async () => {
    const onAdd = vi.fn();
    const resolveUsername = vi.fn().mockResolvedValue(NEWBIE);
    const user = userEvent.setup();
    renderList({ onAdd, resolveUsername });

    await user.click(screen.getByRole("button", { name: "Add collaborator" }));
    await user.type(screen.getByLabelText("Username"), "@newbie");

    // ✓ display name appears once resolved; Add becomes enabled.
    await waitFor(() =>
      expect(screen.getByText("New Bie")).toBeInTheDocument(),
    );
    const dialog = screen.getByRole("dialog");
    const addBtn = within(dialog).getByRole("button", {
      name: "Add collaborator",
    });
    expect(addBtn).toBeEnabled();
    await user.click(addBtn);

    expect(onAdd).toHaveBeenCalledWith("user-2", "viewer");
  });

  it("blocks adding the owner", async () => {
    const onAdd = vi.fn();
    const resolveUsername = vi
      .fn()
      .mockResolvedValue({ id: OWNER_ID, username: "ada", displayName: "Ada" });
    const user = userEvent.setup();
    renderList({ onAdd, resolveUsername });

    await user.click(screen.getByRole("button", { name: "Add collaborator" }));
    await user.type(screen.getByLabelText("Username"), "ada");

    await waitFor(() =>
      expect(
        screen.getByText("That user already owns this timeline."),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add collaborator",
      }),
    ).toBeDisabled();
  });

  it("blocks adding an existing collaborator", async () => {
    const resolveUsername = vi.fn().mockResolvedValue({
      id: "user-1",
      username: "irenejc",
      displayName: "Irène Joliot-Curie",
    });
    const user = userEvent.setup();
    renderList({ resolveUsername });

    await user.click(screen.getByRole("button", { name: "Add collaborator" }));
    await user.type(screen.getByLabelText("Username"), "irenejc");

    await waitFor(() =>
      expect(screen.getByText(/Already a collaborator/)).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add collaborator",
      }),
    ).toBeDisabled();
  });

  it("reports when a username does not resolve", async () => {
    const resolveUsername = vi.fn().mockResolvedValue(null);
    const user = userEvent.setup();
    renderList({ resolveUsername });

    await user.click(screen.getByRole("button", { name: "Add collaborator" }));
    await user.type(screen.getByLabelText("Username"), "ghost");

    await waitFor(() =>
      expect(
        screen.getByText("No user found with that username."),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add collaborator",
      }),
    ).toBeDisabled();
  });

  it("removes a collaborator after confirming the dialog", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    renderList({ onRemove });

    await user.click(
      screen.getByRole("button", { name: "Remove Irène Joliot-Curie" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Remove @irenejc as a collaborator/),
    ).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("user-1");
  });

  it("does not remove when the confirm dialog is cancelled", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    renderList({ onRemove });

    await user.click(
      screen.getByRole("button", { name: "Remove Irène Joliot-Curie" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("changes a collaborator role inline", async () => {
    const onRoleChange = vi.fn();
    const user = userEvent.setup();
    renderList({ onRoleChange });

    await user.selectOptions(
      screen.getByLabelText("Role for Irène Joliot-Curie"),
      "admin",
    );
    expect(onRoleChange).toHaveBeenCalledWith("user-1", "admin");
  });

  it("hides management controls when canManage is false", () => {
    renderList({ canManage: false });
    expect(
      screen.queryByRole("button", { name: "Add collaborator" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Irène Joliot-Curie" }),
    ).not.toBeInTheDocument();
    // Read-only role text instead of a select.
    expect(
      screen.queryByLabelText("Role for Irène Joliot-Curie"),
    ).not.toBeInTheDocument();
  });
});
