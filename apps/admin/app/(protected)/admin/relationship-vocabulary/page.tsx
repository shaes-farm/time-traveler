import { Suspense } from "react";

import { VocabularyManagerShell } from "./_components/vocabulary-manager-shell";

/**
 * Relationship vocabulary management (#428).
 *
 * The three reference tables behind ADR-0040 — categories → types → sub-roles —
 * which every editor's relationship type picker reads and only an admin can
 * write. Access is gated twice: `proxy.ts` on the `/admin` URL prefix, and
 * `(protected)/admin/layout.tsx` in the Node runtime.
 *
 * The Suspense boundary is required: the shell reads `useSearchParams()` for its
 * selection, which opts the subtree into client-side rendering.
 */
export default function RelationshipVocabularyPage() {
  return (
    <Suspense fallback={null}>
      <VocabularyManagerShell />
    </Suspense>
  );
}
