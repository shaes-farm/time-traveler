import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useUiStore } from "@repo/ui/stores";
import { ShellLink } from "./shell-link";

// Capture the props next/link receives so we can drive its `onNavigate` directly
// (jsdom doesn't perform real client-side navigation).
const h = vi.hoisted(() => ({
  onNavigate: undefined as
    ((event: { preventDefault: () => void }) => void) | undefined,
}));

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    children?: React.ReactNode;
    onNavigate?: (event: { preventDefault: () => void }) => void;
  }) => {
    h.onNavigate = props.onNavigate;
    return <a href={props.href}>{props.children}</a>;
  },
}));

beforeEach(() => {
  h.onNavigate = undefined;
  useUiStore.setState({
    dirtyEditors: new Set<string>(),
    pendingNavigation: null,
  });
});

describe("ShellLink onNavigate interception", () => {
  it("intercepts navigation and defers it when an editor is dirty", () => {
    useUiStore.getState().setEditorDirty("editor-a", true);
    render(<ShellLink href="/characters">Characters</ShellLink>);

    const preventDefault = vi.fn();
    h.onNavigate?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(useUiStore.getState().pendingNavigation).toBe("/characters");
  });

  it("lets navigation proceed with no dialog when nothing is dirty", () => {
    render(<ShellLink href="/timelines">Timelines</ShellLink>);

    const preventDefault = vi.fn();
    h.onNavigate?.({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(useUiStore.getState().pendingNavigation).toBeNull();
  });
});
