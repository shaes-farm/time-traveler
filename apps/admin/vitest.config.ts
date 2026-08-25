import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "admin",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "app/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Scope to files that have tests (ADR-0026: no coverage theater on
      // untested app boilerplate). Expand this list as app test coverage grows.
      include: [
        "lib/use-register-unsaved-changes.ts",
        "lib/nav.ts",
        "components/shell-link.tsx",
        "app/**/relationship-vocabulary/_components/category-inspector.tsx",
        "app/**/relationship-vocabulary/_components/deactivate-dialog.tsx",
        "app/**/relationship-vocabulary/_components/delete-vocabulary-dialog.tsx",
        "app/**/relationship-vocabulary/_components/inspector-chrome.tsx",
        "app/**/relationship-vocabulary/_components/reorder-buttons.tsx",
        "app/**/relationship-vocabulary/_components/role-inspector.tsx",
        "app/**/relationship-vocabulary/_components/vocabulary-form-mappers.ts",
        "app/**/relationship-vocabulary/_components/vocabulary-manager-shell.tsx",
        "app/**/relationship-vocabulary/_components/vocabulary-tree-utils.ts",
        "app/**/relationship-vocabulary/_components/vocabulary-tree.tsx",
        "app/**/relationship-vocabulary/_components/type-inspector.tsx",
        "app/**/_components/media/attach-media-dialog.tsx",
        "app/**/_components/media/media-library.tsx",
        "app/**/_components/media/media-section.tsx",
        "app/**/category-form-mappers.ts",
        "app/**/category-tree-utils.ts",
        "app/**/character-detail-helpers.ts",
        "app/**/character-form-mappers.ts",
        "app/**/event-form-mappers.ts",
        "app/**/story-form-mappers.ts",
        "app/**/timeline-form-mappers.ts",
        "app/**/period-form-mappers.ts",
        "app/**/period-tree-utils.ts",
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
