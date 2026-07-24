/**
 * "How it works" — four numbered feature cards with era-hued top rules.
 * Static class strings per era so Tailwind sees every class at build time.
 */
const FEATURES = [
  {
    number: "01",
    title: "Everything connects",
    accent: "border-era-ce",
    body: "Every historical event is a doorway. Pull any thread — an invention, a migration, a discovery — and the whole tapestry of history moves with it.",
  },
  {
    number: "02",
    title: "Hybrid time",
    accent: "border-era-bce",
    body: null, // rendered inline below — carries mono era-code examples
  },
  {
    number: "03",
    title: "Honest about doubt",
    accent: "border-era-kya",
    body: "Every date carries its confession — how precisely it is known. Circa is not a decoration; uncertainty is information. Humility is as important as rigor.",
  },
  {
    number: "04",
    title: "History is made twice",
    accent: "border-era-bya",
    body: "Once when it happens, again when someone records it. The connections do not make themselves visible: someone has to reveal them.",
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
                  One coherent axis from the first second to the futures we
                  imagine. {eraCode("13.8 BYA")} and {eraCode("44 BCE")} live
                  together in the same landscape.
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
