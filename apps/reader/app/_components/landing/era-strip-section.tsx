import { EraTimelineStrip } from "@repo/ui/components/era-timeline-strip";

/**
 * The interactive all-of-time strip. The client boundary lives inside
 * EraTimelineStrip; this wrapper just supplies the landing's section rhythm.
 */
export function EraStripSection() {
  return (
    <section
      aria-label="All of time at a glance"
      className="px-4 pb-19 pt-3 sm:px-10 lg:px-18"
    >
      <EraTimelineStrip />
    </section>
  );
}
