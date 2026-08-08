import { createServiceRoleClient } from "./supabase-admin";
import { TEST_USER } from "./test-user";

/**
 * Prefix-wide sweeps for e2e-created rows — the safety net beneath the
 * per-fixture `afterAll` cleanups.
 *
 * Those cleanups key on an in-memory `Date.now()` stamp, so a crashed or
 * interrupted run takes the stamp with it and strands its rows for good. These
 * sweeps match on the `e2e-` prefix alone, so they can reclaim wreckage from a
 * run that is already over. They run twice (see #355):
 *
 *   - on entry, from the `setup` project, reclaiming the previous run's rows;
 *   - on exit, from the `cleanup` teardown project, so a normal run ends clean.
 *
 * Both are idempotent — a sweep that matches nothing is a no-op.
 */

/**
 * Content tables to sweep, in dependency-safe order.
 *
 * **`events` must precede `timelines`.** `events.timeline_id` and
 * `events.detail_timeline_id` are both `ON DELETE SET NULL` (migrations 00001
 * and 00017 — deliberate, so deleting a sub-timeline detaches a drill-down
 * rather than cascading into the parent event). Delete the timelines first and
 * their events survive as orphans with both columns nulled, no longer matching
 * any timeline-scoped cleanup. `scripts/seed-discovery.mts` orders its own
 * purge the same way.
 *
 * Junction rows need no sweep of their own: every junction FK is
 * `ON DELETE CASCADE` off its parent entity (migration 00002).
 */
const SWEEP_ORDER = [
  "events",
  "characters",
  "stories",
  "timelines",
  "periods",
  "categories",
  "media",
] as const;

/** Slug prefix every e2e fixture and UI-created record shares. */
const E2E_SLUG_PREFIX = "e2e-";

/** Throwaway auth accounts are `e2e-<tag>-<timestamp>@timetraveler.test`. */
const E2E_EMAIL_PATTERN = /^e2e-.+@timetraveler\.test$/;

/**
 * Delete every `e2e-`-slugged row owned by `userId`, across all seven content
 * tables, in {@link SWEEP_ORDER}.
 *
 * Scoped to the one owner so the seeded datasets — `seed-electricity`
 * (`pnpm db:seed:discovery`) and anything owned by `admin@timetraveler.local` —
 * are never in the blast radius.
 */
export async function sweepE2eContent(userId: string): Promise<void> {
  const admin = createServiceRoleClient();

  for (const table of SWEEP_ORDER) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq("user_id", userId)
      .ilike("slug", `${E2E_SLUG_PREFIX}%`);
    // A service-role delete whose filter matches nothing succeeds silently, so
    // an error here is a real failure (bad column, lost connection) and must
    // not pass quietly — a sweep that fails without saying so is how the rows
    // accumulated in the first place.
    if (error) {
      throw new Error(`sweepE2eContent failed on ${table}: ${error.message}`);
    }
  }
}

/**
 * Safety net for the CRUD spines, which delete their record in-band through the
 * UI (that delete *is* the assertion) and so leave a row behind whenever the
 * spec fails or times out before reaching it — and a second row when the retry
 * runs. Each spec records the stamps it created and sweeps them from `afterAll`.
 *
 * `slugPatterns` are `ilike` patterns, one per record, so a worker only ever
 * deletes what it created: `fullyParallel` can split a multi-test spec across
 * workers, and a blanket prefix sweep from one worker's `afterAll` would delete
 * a record another worker was still using.
 *
 * Idempotent — on a passing run the in-band delete already removed the row and
 * these patterns match nothing.
 */
export async function sweepCrudLeftovers(
  table: string,
  slugPatterns: string[],
): Promise<void> {
  if (slugPatterns.length === 0) {
    return;
  }
  const admin = createServiceRoleClient();

  for (const pattern of slugPatterns) {
    const { error } = await admin.from(table).delete().ilike("slug", pattern);
    if (error) {
      throw new Error(
        `sweepCrudLeftovers failed on ${table} (${pattern}): ${error.message}`,
      );
    }
  }
}

/**
 * Delete the throwaway auth accounts the anonymous auth-flow specs create
 * (`e2e-register-…`, `e2e-magic-…`, `e2e-reset-rt-…`, `e2e-logout-…`).
 * `ON DELETE CASCADE` from `auth.users` takes each account's `profiles` row —
 * and any content it owns — with it.
 *
 * {@link TEST_USER} is always preserved: the `authenticated` project's saved
 * `storageState` points at it, and deleting it mid-run would invalidate every
 * signed-in spec. Any account outside the `e2e-…@timetraveler.test` shape
 * (notably `admin@timetraveler.local`, which owns the seeded datasets) is left
 * alone.
 *
 * @param minAgeMs Only delete accounts older than this. The entry sweep passes
 *   an hour because the anonymous `chromium` project does **not** depend on
 *   `setup` (ADR-0036) and so runs concurrently with it — without an age floor
 *   the sweep could delete an account an in-flight auth-flow spec had just
 *   created. Anything a live spec owns is seconds old. The teardown sweep runs
 *   after the specs and passes `0`.
 */
export async function sweepE2eAuthUsers(minAgeMs = 0): Promise<void> {
  const admin = createServiceRoleClient();
  const cutoff = Date.now() - minAgeMs;

  // listUsers paginates and the admin API has no getByEmail, so page until a
  // short page signals the end — the same shape as seedTestUser's lookup.
  const perPage = 1000;
  const doomed: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }
    for (const user of data.users) {
      const email = user.email ?? "";
      if (email === TEST_USER.email || !E2E_EMAIL_PATTERN.test(email)) {
        continue;
      }
      if (Date.parse(user.created_at) > cutoff) {
        continue;
      }
      doomed.push(user.id);
    }
    if (data.users.length < perPage) {
      break;
    }
  }

  for (const id of doomed) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      throw new Error(`sweepE2eAuthUsers failed on ${id}: ${error.message}`);
    }
  }
}
