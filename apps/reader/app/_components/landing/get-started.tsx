import Link from "next/link";
import { REGISTER_HREF, SIGN_IN_HREF } from "../../../lib/nav";

/**
 * "Get started" — the read-vs-author split. Reading is open (in-app CTAs);
 * authoring deep-links OUT to the admin/auth surface as plain anchors
 * (the reader is anonymous and gates nothing — 00-app-shell annotation 3).
 */
export function GetStarted() {
  return (
    <section
      aria-labelledby="get-started-heading"
      className="border-t border-border-muted bg-surface/30 px-4 py-16 sm:px-10 lg:px-18 lg:py-18"
    >
      <h2
        id="get-started-heading"
        className="mb-10 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
      >
        Come find it. Come make it visible.
      </h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border-muted bg-surface p-8">
          <p className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-era-kya">
            Read &amp; explore
          </p>
          <h3 className="mb-2.5 font-display text-2xl font-medium text-foreground">
            No account needed
          </h3>
          <p className="mb-6 text-[15px] leading-relaxed text-foreground-muted">
            Every published timeline and story is open — no sign-up, no paywall.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore timelines
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Read stories
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-border-muted bg-surface p-8">
          <p className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-era-bce">
            Author &amp; publish
          </p>
          <h3 className="mb-2.5 font-display text-2xl font-medium text-foreground">
            Build your own
          </h3>
          <p className="mb-6 text-[15px] leading-relaxed text-foreground-muted">
            Create timelines, characters, and stories — or start from a curated
            library of landmark events. Add to the record, and hand it on.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={REGISTER_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Create an account
              <span aria-hidden className="text-primary">
                →
              </span>
            </a>
            <a
              href={SIGN_IN_HREF}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
