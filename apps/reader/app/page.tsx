import { Hero } from "./_components/landing/hero";
import { EraStripSection } from "./_components/landing/era-strip-section";
import { HowItWorks } from "./_components/landing/how-it-works";
import { WhoItsFor } from "./_components/landing/who-its-for";
import { GetStarted } from "./_components/landing/get-started";
import { Faq } from "./_components/landing/faq";

/**
 * Reader landing — implements the hi-fi design
 * (docs/design/public/08-high-fidelity/Time_Traveler_Landing_Final.html).
 * The persistent chrome (nav, footer, skip-link) is supplied by the shell;
 * the hero's `h1` is the focus target on navigation.
 *
 * The bleed wrapper cancels the shell `main` padding (`px-4 py-8 sm:px-6` in
 * reader-shell.tsx — keep in sync) so section bands and border rules span the
 * full container width; each section owns its own padding. The mid-fi spec's
 * featured/recent rails were dropped by the hi-fi final — divergence tracked
 * in #395.
 */
export default function ReaderHomePage() {
  return (
    <div className="-mx-4 -my-8 sm:-mx-6">
      <Hero />
      <EraStripSection />
      <HowItWorks />
      <WhoItsFor />
      <GetStarted />
      <Faq />
    </div>
  );
}
