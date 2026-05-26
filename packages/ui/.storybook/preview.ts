import type { Preview } from "@storybook/react-vite";
import "./preview-fonts.css";
import "../src/styles/globals.css";

/**
 * Global Storybook configuration.
 *
 * - Loads Google Fonts (Instrument Serif / Inter Tight / JetBrains Mono)
 *   via preview-fonts.css since next/font is unavailable here.
 * - Imports the design system's global styles (Tailwind 4 + tokens).
 * - Backgrounds default to the dark-mode canvas defined in tokens.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "background",
      values: [
        { name: "background", value: "oklch(0.141 0.005 285.823)" },
        { name: "surface", value: "oklch(0.21 0.006 285.885)" },
      ],
    },
  },
};

export default preview;
