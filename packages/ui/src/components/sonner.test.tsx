import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseTheme = vi.fn();
const mockSonner = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("sonner", () => ({
  Toaster: (props: unknown) => {
    mockSonner(props);
    return <div data-testid="sonner-root" />;
  },
}));

import { Toaster } from "./sonner";

function getFirstSonnerCallProps<T>(): T {
  const firstCall = mockSonner.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected sonner Toaster mock to be called at least once");
  }
  return firstCall[0] as T;
}

describe("Toaster", () => {
  beforeEach(() => {
    mockUseTheme.mockReset();
    mockSonner.mockReset();
  });

  it("passes the current theme through to sonner", () => {
    mockUseTheme.mockReturnValue({ theme: "dark" });

    render(<Toaster />);

    expect(mockSonner).toHaveBeenCalledTimes(1);
    const props = getFirstSonnerCallProps<Record<string, unknown>>();
    expect(props.theme).toBe("dark");
    expect(props.className).toBe("toaster group");
  });

  it("falls back to system theme when theme is missing", () => {
    mockUseTheme.mockReturnValue({});

    render(<Toaster />);

    const props = getFirstSonnerCallProps<Record<string, unknown>>();
    expect(props.theme).toBe("system");
  });

  it("provides icon slots and keeps caller props", () => {
    mockUseTheme.mockReturnValue({ theme: "light" });

    render(<Toaster richColors />);

    const props = getFirstSonnerCallProps<{
      richColors?: boolean;
      icons?: Record<string, unknown>;
      toastOptions?: {
        classNames?: Record<string, string>;
      };
    }>();

    expect(props.richColors).toBe(true);
    expect(Object.keys(props.icons ?? {}).sort()).toEqual([
      "error",
      "info",
      "loading",
      "success",
      "warning",
    ]);
    expect(props.toastOptions?.classNames?.toast).toContain("group toast");
    expect(props.toastOptions?.classNames?.actionButton).toContain(
      "text-primary-foreground",
    );
    expect(props.toastOptions?.classNames?.cancelButton).toContain(
      "text-muted-foreground",
    );
  });
});
