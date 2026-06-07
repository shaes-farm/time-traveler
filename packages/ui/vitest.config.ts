import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "ui",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Scope to files that have tests. Expand this list as test coverage grows.
      include: [
        "src/components/autosave-indicator.tsx",
        "src/components/data-table.tsx",
        "src/components/filter-rail.tsx",
        "src/components/shell.tsx",
        "src/components/chip-input.tsx",
        "src/components/button.tsx",
        "src/components/collaborator-list.tsx",
        "src/components/relationship-card.tsx",
        "src/components/relationship-type-selector.tsx",
        "src/components/save-dropdown.tsx",
        "src/components/slug-field.tsx",
        "src/components/temporal-display.tsx",
        "src/components/temporal-input.tsx",
        "src/hooks/use-categories.tsx",
        "src/hooks/use-character-relationships.tsx",
        "src/hooks/use-characters.tsx",
        "src/hooks/use-events.tsx",
        "src/hooks/use-media.tsx",
        "src/hooks/use-periods.tsx",
        "src/hooks/use-profiles.tsx",
        "src/hooks/use-stories.tsx",
        "src/hooks/use-timelines.tsx",
        "src/stores/navigation-store.ts",
        "src/stores/ui-store.ts",
      ],
      exclude: ["src/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
