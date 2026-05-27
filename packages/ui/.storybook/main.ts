import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook 10 configuration for the @repo/ui design-system workbench.
 *
 * Storybook 10 ships the docs + controls + actions features baked into the
 * core package; no addons are required for the foundational stories. Add
 * addons here if/when later batches need them (e.g., a11y panel).
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
  },
  viteFinal(config) {
    // Vite does not define `process.env` in the browser — Next.js/webpack does.
    // Zustand's devtools middleware uses `process.env.NODE_ENV` to gate the Redux
    // DevTools integration, so we replace it at build time here the same way
    // webpack does it in the Next.js app.
    config.define = {
      ...config.define,
      "process.env.NODE_ENV": JSON.stringify(
        process.env["NODE_ENV"] ?? "development",
      ),
    };
    return config;
  },
};

export default config;
