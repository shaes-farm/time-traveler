/**
 * Routing-skeleton placeholder for Search (`/search`). Search is present in the
 * global nav but **stubbed** at launch (00-app-shell annotation 2;
 * screen-inventory §3) — it routes here to a "coming soon" frame so the IA
 * stays stable when search ships. The `h1` is the focus target on navigation.
 */
export default function SearchPage() {
  return (
    <div className="space-y-3 py-12">
      <h1
        tabIndex={-1}
        className="font-display text-3xl text-foreground outline-none"
      >
        Search
      </h1>
      <p className="font-body text-sm text-foreground-muted">
        Search is coming soon.
      </p>
    </div>
  );
}
