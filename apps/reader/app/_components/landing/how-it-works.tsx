/**
 * "How it works" — four numbered feature cards with era-hued top rules.
 * Static class strings per era so Tailwind sees every class at build time.
 */
const FEATURES = [
  {
    number: "01",
    title: "Fractal zoom",
    accent: "border-era-ce",
    body: "Billion-year scales down to a single afternoon. Each level reveals the right detail; a breadcrumb keeps you oriented.",
  },
  {
    number: "02",
    title: "Hybrid time",
    accent: "border-era-bce",
    body: null, // rendered inline below — carries mono era-code examples
  },
  {
    number: "03",
    title: "Characters",
    accent: "border-era-kya",
    body: "Gods and racehorses, detectives and dynasties — seven types, with lifespans, relationships, and roles in the events they shaped.",
  },
  {
    number: "04",
    title: "Stories",
    accent: "border-era-bya",
    body: "The same event, many tellings. Narrative layers over the record — narrator, perspective, order — without overwriting it.",
  },
] as const;

const eraCode = (code: string) => (
  <span className="font-mono text-[13px] text-foreground">{code}</span>
);

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="border-t border-border-muted bg-surface/30 px-4 py-16 sm:px-10 lg:px-16"
    >
      <h2
        id="how-it-works-heading"
        className="mb-10 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
      >
        How it works
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.number}
            className={`border-t-2 pt-5 ${feature.accent}`}
          >
            <span className="font-mono text-[13px] text-foreground-subtle">
              {feature.number}
            </span>
            <h3 className="mb-2 mt-2.5 font-display text-xl font-medium text-foreground">
              {feature.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-foreground-muted">
              {feature.body ?? (
                <>
                  Every date carries its own confession: its era —{" "}
                  {eraCode("13.8 BYA")} or {eraCode("44 BCE")} — how precisely
                  it&apos;s known, and how it came to be known.
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
