import { createServiceRoleClient } from "./supabase-admin";

export interface FractalFixture {
  /** UUID primary key — the timeline detail route keys on this (#234). */
  timelineId: string;
  timelineSlug: string;
  timelineTitle: string;
  subTimelineSlug: string;
  /** Event that expands into the sub-timeline (carries `detail_timeline_id`). */
  expandableEventSlug: string;
  expandableEventTitle: string;
  /** Event with no sub-timeline — no drill-down marker. */
  plainEventSlug: string;
  plainEventTitle: string;
}

/**
 * Seed a minimal fractal timeline owned by `userId`:
 *   - a parent timeline with two **home** events (`events.timeline_id` = parent,
 *     which `getTimelineEventsUnion` surfaces as membership "home"),
 *   - one event expandable (`detail_timeline_id` → a sub-timeline), the other
 *     not — so the Tree view shows exactly one drill-down marker.
 *
 * Slugs are timestamped so repeated local runs don't collide on the per-user
 * slug uniqueness constraint. Rows are left behind (throwaway local DB); no
 * teardown — see the cleanup note on the tracking issue (#355).
 */
export async function seedFractalTimeline(
  userId: string,
): Promise<FractalFixture> {
  const admin = createServiceRoleClient();
  const stamp = Date.now();

  const timelineSlug = `e2e-fractal-parent-${stamp}`;
  const timelineTitle = `E2E Fractal Parent ${stamp}`;
  const subTimelineSlug = `e2e-fractal-sub-${stamp}`;

  const { data: timelines, error: timelineError } = await admin
    .from("timelines")
    .insert([
      {
        user_id: userId,
        slug: timelineSlug,
        title: timelineTitle,
        temporal_data: { era: "CE", year: 2000 },
      },
      {
        user_id: userId,
        slug: subTimelineSlug,
        title: `E2E Fractal Sub ${stamp}`,
        temporal_data: { era: "CE", year: 2001 },
      },
    ])
    .select("id, slug");
  if (timelineError) {
    throw timelineError;
  }

  const rows = (timelines ?? []) as Array<{ id: string; slug: string }>;
  const parentId = rows.find((t) => t.slug === timelineSlug)?.id;
  const subId = rows.find((t) => t.slug === subTimelineSlug)?.id;
  if (!parentId || !subId) {
    throw new Error("Failed to seed fractal timelines");
  }

  const expandableEventSlug = `e2e-fractal-event-expandable-${stamp}`;
  const expandableEventTitle = `Expandable Event ${stamp}`;
  const plainEventSlug = `e2e-fractal-event-plain-${stamp}`;
  const plainEventTitle = `Plain Event ${stamp}`;

  const { error: eventError } = await admin.from("events").insert([
    {
      user_id: userId,
      timeline_id: parentId,
      detail_timeline_id: subId,
      slug: expandableEventSlug,
      title: expandableEventTitle,
      temporal_data: { era: "CE", year: 2000 },
    },
    {
      user_id: userId,
      timeline_id: parentId,
      detail_timeline_id: null,
      slug: plainEventSlug,
      title: plainEventTitle,
      temporal_data: { era: "CE", year: 2001 },
    },
  ]);
  if (eventError) {
    throw eventError;
  }

  return {
    timelineId: parentId,
    timelineSlug,
    timelineTitle,
    subTimelineSlug,
    expandableEventSlug,
    expandableEventTitle,
    plainEventSlug,
    plainEventTitle,
  };
}
