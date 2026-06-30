import type { MediaFacetSelection } from "@repo/ui/components/media-picker";
import { MediaLibrary } from "../_components/media/media-library";

const ATTACHED_TO = ["events", "characters", "timelines", "orphaned"];
const MEDIA_TYPES = ["image", "video", "audio", "document"];
const SOURCES = ["upload", "external"];

type SearchParams = Record<string, string | string[] | undefined>;

/** Read a (possibly repeated or comma-joined) query param, keeping only values
 * in `allowed` so the deep-link can't seed unknown facet chips. */
function readFacet(value: string | string[] | undefined, allowed: string[]) {
  if (value === undefined) return [];
  const parts = (Array.isArray(value) ? value : value.split(",")).map((v) =>
    v.trim(),
  );
  return parts.filter((v) => allowed.includes(v));
}

/**
 * Cross-entity Media Library (screen 17). Hydrates the filter facets from the
 * URL — the dashboard recent-counts surface deep-links here (e.g.
 * `/media?attachedTo=orphaned`) — then hands off to the client component.
 */
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialFacets: MediaFacetSelection = {
    mediaTypes: readFacet(params.mediaTypes, MEDIA_TYPES),
    sources: readFacet(params.sources, SOURCES),
    attachedTo: readFacet(params.attachedTo, ATTACHED_TO),
  };

  return <MediaLibrary initialFacets={initialFacets} />;
}
