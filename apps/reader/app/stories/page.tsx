/**
 * Routing-skeleton placeholder for Stories (`/stories`). The story browser is a
 * separate ticket; this exists so the persistent shell can be verified across
 * navigations. The `h1` is the focus target on navigation.
 */
export default function StoriesPage() {
  return (
    <div className="space-y-3 py-12">
      <h1
        tabIndex={-1}
        className="font-display text-3xl text-foreground outline-none"
      >
        Stories
      </h1>
      <p className="font-body text-sm text-foreground-muted">
        The story browser is coming soon.
      </p>
    </div>
  );
}
