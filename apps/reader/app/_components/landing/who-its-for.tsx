/**
 * "Who it's for" — four persona cards with mono era-hued kickers.
 * Static class strings per persona so Tailwind sees every class at build time.
 */
const PERSONAS = [
  {
    label: "Educators",
    accent: "text-era-ce",
    body: "Turn any era into an explorable map — from an invention down to a single discovery.",
  },
  {
    label: "Researchers",
    accent: "text-era-mya",
    body: "Log-scale overviews, honest uncertainty ranges, and relationship networks.",
  },
  {
    label: "Storytellers",
    accent: "text-era-bya",
    body: "Weave myth and history — seven character types, perspectives, nested arcs.",
  },
  {
    label: "The curious",
    accent: "text-era-kya",
    body: "Wander 13.8 billion years and watch the patterns across time appear.",
  },
] as const;

export function WhoItsFor() {
  return (
    <section
      aria-labelledby="who-its-for-heading"
      className="border-t border-border-muted px-4 py-16 sm:px-10 lg:px-16"
    >
      <h2
        id="who-its-for-heading"
        className="mb-2.5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
      >
        Every question reveals a different landscape
      </h2>
      <p className="mb-10 max-w-[800px] text-foreground-muted">
        Time Traveler doesn&apos;t prescribe the route — one reader, many ways
        in, and the timeline and the story are always one continuous surface.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERSONAS.map((persona) => (
          <div
            key={persona.label}
            className="rounded-lg border border-border-muted bg-surface p-6"
          >
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.12em] ${persona.accent}`}
            >
              {persona.label}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {persona.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
