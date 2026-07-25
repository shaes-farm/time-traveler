/**
 * FAQ — native <details>/<summary>, no JS. Content is verbatim from the hi-fi
 * landing design, but styled as its own closing section (dark band, section-
 * level heading) rather than nested under "Get started" — the shared
 * bg-surface/30 band and missing divider made it read as a subsection.
 */
const FAQS = [
  {
    question: "How far back does it go?",
    answer:
      "To the first second of the universe. Time Traveler recognizes no boundary between cosmology, geology, biology, and recorded history — they are chapters of the same story.",
  },
  {
    question: "What about uncertain dates?",
    answer:
      "Uncertainty is a first-class citizen. Every date shows how precisely it is known — exact, circa, or an estimated range — never hidden behind confident tick marks.",
  },
  {
    question: "Can I build my own timelines?",
    answer:
      "Yes. History is made twice — once when it happens, again when someone records it. Authoring lives in the studio, exploring published work lives here where it is discovered.",
  },
  {
    question: "Does everything have to be factual?",
    answer:
      "No. The imagined past, present, or future is also supported. Gods and racehorses, corporations and fictional detectives — anything with a story across time can live here, clearly on its own terms.",
  },
] as const;

export function Faq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="border-t border-border-muted bg-background px-4 py-16 sm:px-10 lg:px-18 lg:py-18"
    >
      <h2
        id="faq-heading"
        className="mb-10 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
      >
        Questions
      </h2>
      <div className="border-t border-border-muted">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group border-b border-border-muted"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-foreground [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span
                aria-hidden
                className="text-lg text-primary transition-transform duration-fast ease-standard group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-foreground-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
