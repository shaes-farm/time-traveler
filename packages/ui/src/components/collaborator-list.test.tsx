import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CollaboratorList, type Collaborator } from "./collaborator-list";

const COLLABORATORS: Collaborator[] = [
  {
    id: "1",
    username: "irenejc",
    displayName: "Irène Joliot-Curie",
    role: "editor",
  },
];

describe("CollaboratorList", () => {
  it("renders collaborators and the non-removable owner line", () => {
    render(<CollaboratorList collaborators={COLLABORATORS} ownerName="Ada" />);
    expect(screen.getByText("@irenejc")).toBeInTheDocument();
    expect(screen.getByText(/Owner: Ada/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no collaborators", () => {
    render(<CollaboratorList collaborators={[]} ownerName="Ada" />);
    expect(screen.getByText(/No collaborators yet/)).toBeInTheDocument();
  });

  it("adds a collaborator by username", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <CollaboratorList
        collaborators={COLLABORATORS}
        ownerName="Ada"
        onAdd={onAdd}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add collaborator" }));
    await user.type(screen.getByLabelText("Username"), "@newbie");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith("newbie", "viewer");
  });

  it("removes a collaborator", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <CollaboratorList
        collaborators={COLLABORATORS}
        ownerName="Ada"
        onRemove={onRemove}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remove Irène Joliot-Curie" }),
    );
    expect(onRemove).toHaveBeenCalledWith("1");
  });

  it("changes a collaborator role", async () => {
    const onRoleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CollaboratorList
        collaborators={COLLABORATORS}
        ownerName="Ada"
        onRoleChange={onRoleChange}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Role for Irène Joliot-Curie"),
      "admin",
    );
    expect(onRoleChange).toHaveBeenCalledWith("1", "admin");
  });

  it("hides management controls when canManage is false", () => {
    render(
      <CollaboratorList
        collaborators={COLLABORATORS}
        ownerName="Ada"
        canManage={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Add collaborator" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Irène Joliot-Curie" }),
    ).not.toBeInTheDocument();
  });
});
