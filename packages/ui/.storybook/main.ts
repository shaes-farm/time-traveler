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
};

export default config;
