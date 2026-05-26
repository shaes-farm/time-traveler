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
        "src/components/button.tsx",
        "src/components/temporal-display.tsx",
        "src/hooks/use-categories.tsx",
        "src/hooks/use-character-relationships.tsx",
        "src/hooks/use-characters.tsx",
        "src/hooks/use-events.tsx",
        "src/hooks/use-media.tsx",
        "src/hooks/use-periods.tsx",
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
