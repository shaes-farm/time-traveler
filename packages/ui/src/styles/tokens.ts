/**
 * Design tokens — TypeScript source-of-truth for the Time Traveler admin
 * design system (per docs/design/admin/fidelity-2-plan.md).
 *
 * The companion `tokens.css` holds the same values inside a Tailwind 4
 * `@theme` block. Keep the two files in sync manually; a generator script
 * may replace the dual maintenance in a later batch once the token count
 * justifies it.
 *
 * Conventions:
 * - Dark-mode default per docs/design/admin/03-aesthetic-notes.md.
 * - Colors expressed in OKLCH (the color space Tailwind 4 uses internally).
 *   Reference values mirror Tailwind 4's zinc palette.
 * - Accent slots (era hues, status badges, importance gradient) are
 *   intentionally absent and crystallize in Batch B / C / D when the
 *   primitives that need them are designed.
 */

export const colors = {
  // Surface / chrome
  background: "oklch(0.141 0.005 285.823)", // zinc-950 — main canvas
  surface: "oklch(0.21 0.006 285.885)", // zinc-900 — cards, popovers
  surface2: "oklch(0.274 0.006 286.033)", // zinc-800 — raised surfaces

  // Text
  foreground: "oklch(0.985 0 0)", // zinc-50 — primary text
  foregroundMuted: "oklch(0.705 0.015 286.067)", // zinc-400 — secondary text
  foregroundSubtle: "oklch(0.552 0.016 285.938)", // zinc-500 — placeholder / dim

  // Lines + structure
  border: "oklch(0.274 0.006 286.033)", // zinc-800
  borderMuted: "oklch(0.21 0.006 285.885)", // zinc-900 — fainter dividers

  // Primary accent — placeholder; finalized when Batch B (temporal primitive)
  // crystallizes the accent role.
  primary: "oklch(0.985 0 0)", // zinc-50 (high contrast)
  primaryForeground: "oklch(0.141 0.005 285.823)", // zinc-950

  // Destructive — only fresh value introduced by the shadcn primitive layer.
  // Mirrors Tailwind 4 red-500 in OKLCH for delete/dangerous actions.
  destructive: "oklch(0.637 0.237 25.331)", // red-500
  destructiveForeground: "oklch(0.985 0 0)", // zinc-50 (white on red)

  // Era accents — TemporalDisplay primitive. Hues spread across the wheel
  // with consistent lightness so each reads as a peer in lists/tables. Low
  // chroma keeps the dark canvas calm and avoids the "no purple gradients"
  // anti-pattern. CE/BCE/KYA/MYA/BYA satisfy red-green colorblindness
  // *together with* the typographic mono accent the primitive layers on —
  // hue alone is not the load-bearing signal.
  eraCe: "oklch(0.78 0.10 60)", // warm amber — modern era
  eraBce: "oklch(0.78 0.10 100)", // gold — historical
  eraKya: "oklch(0.74 0.09 200)", // teal — ancient
  eraMya: "oklch(0.74 0.09 260)", // blue — deep historical
  eraBya: "oklch(0.74 0.10 320)", // magenta — cosmic

  // Importance gradient — DataTable / FilterRail. Single amber hue (55),
  // rising lightness and chroma across four brackets so the 1–10 scale
  // reads as a single ramp. Colorblind-safe: label + icon carry the signal.
  importanceLow: "oklch(0.55 0.05 55)", // 1–3 — dim, low chroma
  importanceMedium: "oklch(0.65 0.09 55)", // 4–6 — mid amber
  importanceHigh: "oklch(0.74 0.14 55)", // 7–8 — bright amber
  importanceCritical: "oklch(0.81 0.18 55)", // 9–10 — saturated gold
} as const;

export const fonts = {
  // Bound to Google Fonts via `next/font` in apps/admin/app/layout.tsx, which
  // sets the underlying `--font-fraunces` / `--font-inter-tight` /
  // `--font-jetbrains-mono` CSS variables on <html>. Swapping fonts later
  // means updating both the next/font import and these variable names.
  display: "var(--font-fraunces), serif",
  body: "var(--font-inter-tight), sans-serif",
  mono: "var(--font-jetbrains-mono), ui-monospace, monospace",
} as const;

export const radii = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;

// Motion — duration scale (ADR-0032 / docs/design/public/06-mid-fidelity/
// motion-spec.md §1.1). Semantic steps, not free values: the public reader's
// five motion classes bind to these names instead of scattering millisecond
// literals. `instant` is the reduced-motion target — under
// `prefers-reduced-motion: reduce`, motion.css resolves every duration token
// to 0ms in one place so no surface can ship un-reduced motion (ADR-0032
// IMP-002, motion-spec §5).
export const durations = {
  instant: "0ms", // reduced-motion target; immediate state swap
  fast: "120ms", // micro-feedback; the "out" half of enter-exit
  base: "200ms", // cross-fade; facet/list/scale-toggle swaps; ambient-presence
  slow: "320ms", // context-shift; overlay entrance (enter-exit "in")
  deliberate: "480ms", // fractal-zoom camera flight — the only spatial transition
} as const;

// Motion — easing scale (ADR-0032 / motion-spec §1.2).
export const easings = {
  standard: "cubic-bezier(0.2, 0, 0, 1)", // default; fractal-zoom, context-shift, swaps
  decelerate: "cubic-bezier(0, 0, 0, 1)", // entrances (enter half of enter-exit)
  accelerate: "cubic-bezier(0.3, 0, 1, 1)", // exits (exit half of enter-exit)
} as const;

export type ColorToken = keyof typeof colors;
export type FontToken = keyof typeof fonts;
export type RadiusToken = keyof typeof radii;
export type DurationToken = keyof typeof durations;
export type EasingToken = keyof typeof easings;
