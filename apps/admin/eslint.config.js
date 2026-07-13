import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Generated Playwright artifacts (gitignored): the HTML report and trace
    // bundles are minified third-party output, not source. Ignore them so a
    // local `test:e2e` run doesn't flood the pre-push lint gate.
    ignores: ["playwright-report/**", "test-results/**"],
  },
];
