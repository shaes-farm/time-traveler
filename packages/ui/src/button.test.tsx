import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button.js";

describe("Button", () => {
  it("renders children", () => {
    render(<Button appName="test">Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies className prop", () => {
    render(
      <Button appName="test" className="custom-class">
        Styled
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("calls alert with appName on click", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<Button appName="admin">Go</Button>);
    await user.click(screen.getByRole("button"));

    expect(alertSpy).toHaveBeenCalledWith("Hello from your admin app!");
    alertSpy.mockRestore();
  });
});
