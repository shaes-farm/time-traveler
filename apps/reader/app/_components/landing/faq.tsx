/**
 * FAQ — native <details>/<summary>, no JS. Copy verbatim from the hi-fi
 * landing design. Lives inside the "Get started" band per the mockup.
 */
const FAQS = [
  {
    question: "Do I need an account?",
    answer:
      "No — reading and exploring is completely open. An account is only for authoring your own content.",
  },
  {
    question: "How far back does it go?",
    answer:
      "13.8 billion years — Big Bang to present, and into speculative futures. Every date carries its era and precision.",
  },
  {
    question: "Timeline vs. story?",
    answer:
      "A timeline is the zoomable map of events; a story is a narrative telling laid over them — narrator, perspective, and its own order.",
  },
  {
    question: "What is fractal navigation?",
    answer:
      "Any event opens into its own sub-timeline. Zoom into a war, find the battles; zoom into a battle, find the hours.",
  },
] as const;

export function Faq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="bg-surface/30 px-4 pb-16 pt-6 sm:px-10 lg:px-16"
    >
      <h3
        id="faq-heading"
        className="mb-2 font-display text-2xl font-medium text-foreground"
      >
        Questions
      </h3>
      <div className="mt-4 grid border-t border-border-muted lg:grid-cols-2 lg:gap-x-10">
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
