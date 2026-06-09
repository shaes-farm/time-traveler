/**
 * PostCSS config for the reader app.
 *
 * Tailwind 4 ships as a single PostCSS plugin. The plugin also handles
 * @import resolution (including workspace packages like @repo/ui).
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
