import { createServiceRoleClient } from "./supabase-admin";

/**
 * A single seeded media row, with the attributes the library-shell spec filters
 * on. Every seeded row is `source: "external"` (no Storage object — external
 * embeds carry a NULL storage_path per the media_source_storage_ck DB guard) and
 * orphaned (no junction rows), so the Type facet and the orphan bulk-delete
 * cleanup can both be exercised without touching Supabase Storage.
 */
export interface SeededMedia {
  slug: string;
  /** Doubles as the card's visible label (mediaLabel = alt_text || caption ||
   * slug) and the search target (server ilike over alt_text/caption/slug). */
  altText: string;
  mediaType: string;
  url: string;
}

export interface MediaListFixture {
  /** Timestamp shared by every seeded slug/altText — the spec searches on it to
   * isolate its own rows from the shared authenticated DB. */
  stamp: number;
  media: SeededMedia[];
}

/**
 * Seed a small, deterministic set of orphaned external media owned by `userId`,
 * with varied `media_type` so the library-shell spec can exercise the Type
 * facet against real rows (two `image`, one `video`, one `audio` → a Type=Image
 * filter leaves a clean 2-of-4 subset). All rows are orphaned (no junctions), so
 * an Attached-to=Orphaned filter surfaces the full set for the bulk-delete
 * cleanup path.
 *
 * The media library is client-state-driven (search/facets/view/cursor are local
 * `useState`, not URL params — like periods), but search and facets still drive
 * SERVER queries, so isolation is a full-text-ish ilike search on the shared
 * timestamp baked into every altText + slug. Pair with {@link cleanupMediaList}
 * in an `afterAll` (the #355 teardown note).
 */
export async function seedMediaList(userId: string): Promise<MediaListFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();

  const specs: { mediaType: string; ext: string }[] = [
    { mediaType: "image", ext: "png" },
    { mediaType: "image", ext: "jpg" },
    { mediaType: "video", ext: "mp4" },
    { mediaType: "audio", ext: "mp3" },
  ];

  const media: SeededMedia[] = specs.map((s, i) => ({
    slug: `e2e-list-media-${i}-${stamp}`,
    altText: `E2E List ${stamp} — ${s.mediaType} ${i}`,
    mediaType: s.mediaType,
    url: `https://example.com/e2e-${stamp}-${i}.${s.ext}`,
  }));

  const { error } = await admin.from("media").insert(
    media.map((m) => ({
      user_id: userId,
      slug: m.slug,
      alt_text: m.altText,
      media_type: m.mediaType,
      source: "external",
      storage_path: null,
      url: m.url,
    })),
  );
  if (error) {
    throw error;
  }

  return { stamp, media };
}

/**
 * Delete every media row seeded under `stamp` (matched by the timestamp in the
 * slug). Idempotent — the bulk-delete test removes some rows itself, so this
 * only sweeps survivors; call from `afterAll` so a run leaves the shared DB
 * clean.
 */
export async function cleanupMediaList(stamp: number): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("media")
    .delete()
    .ilike("slug", `e2e-list-media-%-${stamp}`);
  if (error) {
    throw error;
  }
}
