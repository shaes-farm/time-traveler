import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * Shared Vite config — picked up by Storybook 10 (via @storybook/react-vite)
 * to register the Tailwind 4 plugin so utility classes are compiled in the
 * Storybook build.
 *
 * Vitest has its own config in `vitest.config.ts` and does not inherit from
 * this file. The two coexist intentionally.
 */
export default defineConfig({
  plugins: [tailwindcss()],
});
