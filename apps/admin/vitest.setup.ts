import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom shims for Radix UI primitives (Select, Popover, etc.) which rely on
// DOM APIs that jsdom doesn't implement. Without these, any test that mounts
// a Radix Select trigger or opens a portal-based menu throws at render time.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof Element !== "undefined") {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
}
