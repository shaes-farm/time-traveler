/**
 * The default inspector pane (route: `/categories`). The tree lives in the
 * layout; this fills the right-hand aside until a node is selected or a new
 * one is being created (those are the `[id]` and `new` nested routes).
 */
export default function CategoriesPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-foreground-muted">
      Select a category to edit, or create a new one.
    </div>
  );
}
