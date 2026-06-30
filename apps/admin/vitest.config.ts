import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "admin",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Scope to files that have tests (ADR-0026: no coverage theater on
      // untested app boilerplate). Expand this list as app test coverage grows.
      include: [
        "app/**/_components/media/attach-media-dialog.tsx",
        "app/**/_components/media/media-library.tsx",
        "app/**/_components/media/media-section.tsx",
        "app/**/event-form-mappers.ts",
        "app/**/timeline-form-mappers.ts",
      ],
      exclude: ["app/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
