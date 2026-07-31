# On-Demand Seed: The Human Discovery of Time

This repository includes a manual seed script for the project's first
production-quality canonical dataset — **"The Human Discovery of Time."** It is
the reference implementation ("Rosetta Stone") described in
[docs/the-human-discovery-of-time.md](the-human-discovery-of-time.md): a corpus
chosen because it exercises nearly every subsystem of Time Traveler while
telling one coherent story — how humans came to perceive, predict, and measure
time.

The script does not run during `db:reset` and is safe to run on demand. It loads
the root-level `.env.local` automatically via `dotenv` (through
[`scripts/lib/seed-common.mts`](../scripts/lib/seed-common.mts)) before reading
environment variables. It is independent of, and coexists with, the
[Age of Scientific Discovery seed](seeding-discovery.md) — different slug prefix,
no shared rows.

## What it seeds

A **foundation slice** (~90 events): the full 12-phase backbone plus three
deeply-fleshed branches, sized to exercise every subsystem while staying
curatable. It grows organically later by recursive expansion.

- **1 root period:** The Human Discovery of Time (14 BYA → an estimated 2200 CE).
- **16 timelines:**
  - 1 **root** backbone timeline containing 12 milestone events.
  - 12 **phase** sub-timelines (Universe Creates Time → Future Time).
  - 3 **deeper** drill-down sub-timelines: _The First Three Minutes_ and _The
    Giant Impact_ (under Phase 1), and _The Longitude Problem_ (under Phase 7).
- **~93 events**, from the Big Bang to speculative future clocks.
- **46 characters** spanning **all seven character types**:
  - **human** (astronomers, calendar reformers, horologists, engineers),
  - **artifact** (the instrument chain: shadow clock → … → optical lattice clock),
  - **organization** (Board of Longitude, Royal Observatory Greenwich, NPL, BIPM, IERS, CERN),
  - **divine** (Ra, Thoth) and **mythological** (Chronos, Janus) time-deities,
  - **animal** (the Arctic Tern, a biological clock),
  - **fictional** (the White Rabbit — the CERN timing protocol is named after him).
- **31 character relationships** forming a causal graph using the extended
  vocabulary from ADR-0040 (see #419): `superseded`, `improved`, `derived_from`,
  `enabled`, `influenced`, `inspired`, `patented`, `standardized`, `adopted`,
  `challenged`, `copied`, `rivalry`, `collaboration`, `creator_creation`.
- Junction rows in `period_timelines`, `timeline_events`, and `event_characters`.

> **Prerequisite:** 23 of those 31 relationship rows use causal verbs that do
> not yet exist in `character_relationships.relationship_type`. The vocabulary
> is delivered by #419; until its first PR merges, seeding fails with `23514`
> on those rows. Everything else in this dataset is independent of #419.

### What it demonstrates

- **Fractal nesting** (three levels) — the root timeline's 12 events each
  "explode" into a phase sub-timeline via `events.detail_timeline_id`; two of
  those phases drill a further level. Drilling a backbone event opens its
  sub-timeline.
- **The full temporal range** — `BYA`/`MYA` cosmology with
  `display_format: cosmological`/`geological`, through `CE` modernity, to an
  `estimated`, low-confidence future.
- **Concurrent development** — the Record branch places the Egyptian, Babylonian,
  Chinese, Maya, Roman, Indian, and Islamic calendars as parallel, overlapping
  events on one timeline.
- **Narrative order vs. chronology** — the backbone's `timeline_events.sort_order`
  (order of discovery) deliberately differs from `sort_order_years` (strict
  chronology): standardization (1884) precedes synchronization (1852) in the
  narrative, faithfully modeling overlapping history.
- **Modeling boundary** — instruments/organizations/deities are characters;
  observations and concepts are events. Causal ties between characters are
  `character_relationships`; a person's stance toward a phenomenon (observed,
  predicted, measured) is `event_characters` participation.

## Rerun behavior

Delete-and-recreate, scoped to the `seed-hdt-` slug prefix for the target user:

- Deletes existing `seed-hdt-%` events, characters, timelines, and periods
  (junction rows cascade from their parents).
- Recreates the period, all timelines, characters, events, and junction rows.

The Age of Scientific Discovery dataset (`seed-electricity-`) is untouched.

## Required environment variables

- `SUPABASE_SERVICE_ROLE_KEY`: service key used for insert/delete operations
  (bypasses RLS, so every row's `user_id` is set explicitly).

Optional:

- `SUPABASE_URL` (default `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_URL` used as fallback if `SUPABASE_URL` is not set
- `SEED_ADMIN_EMAIL` (default `admin@timetraveler.local`)
- `SEED_ADMIN_PASSWORD` (default `Admin123!`)

## Usage

Start Supabase first:

```bash
pnpm run db:start
```

Run the seed script:

```bash
pnpm run db:seed:human-time
```

The command assumes `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_URL`)
are already defined in root `.env.local`. You can also pass values directly as
CLI args:

```bash
pnpm run db:seed:human-time -- \
  --service-role-key=<service-role-key> \
  --admin-email=admin@timetraveler.local \
  --admin-password='Admin123!' \
  --url=http://127.0.0.1:54321
```

## Notes

- The script creates `admin@timetraveler.local` if missing (and refreshes its
  password if present), then sets the matching profile role to `admin`. The
  dataset is owned by that admin account.
- Seed rows are tagged in `metadata` with `seed_dataset: human_discovery_of_time`,
  `seed_version: v1`, `seed_prefix: seed-hdt`, and a `seed_key` per row. Calendar
  supersession is additionally recorded in event `metadata.supersedes_slug`
  (calendars are events, so their supersession is data rather than a
  character-to-character relationship).
- Timelines are seeded with `visibility: public` so the (future) reader app can
  surface them.
- This script is intended for local/dev/test workflows and shares its transport
  plumbing with the Age of Scientific Discovery seed via
  [`scripts/lib/seed-common.mts`](../scripts/lib/seed-common.mts).
