import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "services",
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Scope to files that have tests. Expand this list as test coverage grows.
      include: [
        "src/schemas/temporal.ts",
        "src/schemas/character.ts",
        "src/schemas/event.ts",
        "src/schemas/period.ts",
        "src/schemas/timeline.ts",
        "src/modules/temporal-service.ts",
        "src/utils/slug.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
