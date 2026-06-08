// Integration check for the has-participants / has-media filter semantics in
// getEventsPage, run against a live local Supabase stack. It exists because the
// unit tests mock the query builder and therefore can't catch PostgREST
// REST-layer behavior — and pgTAP (`db:test`) only covers SQL, not PostgREST
// embed semantics.
//
// It proved the bug that a `child(count)` aggregate embed combined with
// `child=is.null` returns an accurate `count: "exact"` but EMPTY data rows, and
// it guards the three-way embed strategy getEventsPage now uses:
//   • has ≥1   → child!inner(count)
//   • has none → child(child_fk)  +  .is(child, null)   (plain column embed)
//   • neither  → child(count)      (display only)
//
// Usage (stack must be running — `pnpm db:start`):
//   SERVICE_ROLE_KEY=<local service_role key> \
//     pnpm --filter @repo/services verify:has-filters
//   # optional: API_URL=http://127.0.0.1:54321 (default)
//
// Self-cleaning: deletes the seeded auth user on exit (ON DELETE CASCADE removes
// the seeded events/characters/media/junctions). Exits non-zero on any failure.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.API_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.SERVICE_ROLE_KEY;
if (!KEY) {
  console.error(
    "SERVICE_ROLE_KEY env var required (get it from `pnpm db:status`).",
  );
  process.exit(2);
}

const db = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tag = `verify-${Date.now()}`;
let userId;
let failures = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}: got ${actual}, want ${expected}`,
  );
}

// Mirrors the exact select clauses + filters getEventsPage builds, scoped to the
// seeded user so count: "exact" is deterministic. Keep in sync with getEventsPage.
async function page({ hasParticipants, hasMedia }) {
  const charsEmbed =
    hasParticipants === true
      ? "event_characters!inner(count)"
      : hasParticipants === false
        ? "event_characters(event_id)"
        : "event_characters(count)";
  const mediaEmbed =
    hasMedia === true
      ? "event_media!inner(count)"
      : hasMedia === false
        ? "event_media(event_id)"
        : "event_media(count)";
  const select = `*, event_categories(categories(id, title, color)), ${charsEmbed}, ${mediaEmbed}`;

  let q = db
    .from("events")
    .select(select, { count: "exact" })
    .eq("user_id", userId);
  if (hasParticipants === false) q = q.is("event_characters", null);
  if (hasMedia === false) q = q.is("event_media", null);

  const { data, count, error } = await q;
  if (error) throw new Error(`query error: ${error.message}`);
  return { rows: data ?? [], count: count ?? 0 };
}

try {
  const { data: u, error: uerr } = await db.auth.admin.createUser({
    email: `${tag}@example.com`,
    password: "verify-pass-123!",
    email_confirm: true,
  });
  if (uerr) throw uerr;
  userId = u.user.id;

  // Event A has a participant + media; event B has neither.
  const temporal = { era: "CE", year: 1969, precision: "exact" };
  const { data: events, error: eerr } = await db
    .from("events")
    .insert([
      {
        user_id: userId,
        slug: `${tag}-a`,
        title: "A has rels",
        temporal_data: temporal,
      },
      {
        user_id: userId,
        slug: `${tag}-b`,
        title: "B no rels",
        temporal_data: temporal,
      },
    ])
    .select("id, slug");
  if (eerr) throw eerr;
  const eventA = events.find((e) => e.slug === `${tag}-a`).id;

  const { data: ch, error: cherr } = await db
    .from("characters")
    .insert({
      user_id: userId,
      slug: `${tag}-c`,
      name: "Char",
      character_type: "human",
    })
    .select("id")
    .single();
  if (cherr) throw cherr;

  const { data: md, error: mderr } = await db
    .from("media")
    .insert({
      user_id: userId,
      slug: `${tag}-m`,
      storage_path: "x/y.png",
      url: "http://x/y.png",
      media_type: "image",
    })
    .select("id")
    .single();
  if (mderr) throw mderr;

  const { error: ecerr } = await db.from("event_characters").insert({
    event_id: eventA,
    character_id: ch.id,
    role: "participant",
    significance: "primary",
  });
  if (ecerr) throw ecerr;
  const { error: emerr } = await db
    .from("event_media")
    .insert({ event_id: eventA, media_id: md.id, sort_order: 0 });
  if (emerr) throw emerr;

  const all = await page({});
  check("baseline count (both events)", all.count, 2);

  const hasP = await page({ hasParticipants: true });
  check("hasParticipants=true count", hasP.count, 1);
  check("hasParticipants=true is event A", hasP.rows[0]?.slug, `${tag}-a`);

  const noP = await page({ hasParticipants: false });
  check("hasParticipants=false count", noP.count, 1);
  check("hasParticipants=false is event B", noP.rows[0]?.slug, `${tag}-b`);

  const hasM = await page({ hasMedia: true });
  check("hasMedia=true count", hasM.count, 1);
  check("hasMedia=true is event A", hasM.rows[0]?.slug, `${tag}-a`);

  const noM = await page({ hasMedia: false });
  check("hasMedia=false count", noM.count, 1);
  check("hasMedia=false is event B", noM.rows[0]?.slug, `${tag}-b`);

  check(
    "event A participant count embed",
    hasP.rows[0]?.event_characters?.[0]?.count,
    1,
  );
} finally {
  if (userId) {
    await db.auth.admin.deleteUser(userId);
    console.log("cleaned up test user");
  }
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
