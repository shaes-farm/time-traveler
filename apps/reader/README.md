# reader

Public, read-only Next.js app for the Time Traveler reader experience.

## Development

```bash
pnpm --filter reader dev
```

Runs on http://localhost:3002.

## End-to-end tests

Playwright specs live in `e2e/`. They run on demand and are deliberately kept
off the CI gate ([ADR-0036](../../docs/adr/adr-0036-e2e-testing-strategy.md)).

```bash
pnpm --filter reader exec playwright install chromium   # one-time
pnpm --filter reader test:e2e                           # run the suite
pnpm --filter reader test:e2e:ui                        # interactive runner
pnpm --filter reader test:e2e:report                    # last HTML report
```

Playwright boots the dev server itself and reuses one already running on
:3002. Unlike the admin suite, these need **no local Supabase and no seeded
user** — the reader is anonymous and read-only
([ADR-0030](../../docs/adr/adr-0030-public-reader-app-placement.md)). A
`.env.local` must exist, though: the realtime provider constructs the anon
Supabase client after mount, and `@repo/services/supabase/client` throws when
the public env vars are missing. Copy `.env.local.example` to start.

Note that `pnpm test:e2e` from the repo root runs **both** app suites via
Turborepo; admin's half does require local Supabase.
