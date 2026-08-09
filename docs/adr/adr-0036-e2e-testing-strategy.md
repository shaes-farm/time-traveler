---
title: "ADR-0036: End-to-end testing strategy (Playwright, local-first, off the PR gate)"
status: "Accepted"
date: "2026-07-08"
authors: "Admin frontend + platform"
tags: ["architecture", "decision", "testing", "ci", "admin"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0036: End-to-end testing strategy (Playwright, local-first, off the PR gate)

## Status

**Accepted**

## Context

`apps/admin` has grown a real interaction surface — cookie-based auth
(`@supabase/ssr`), a protected app shell, list pages, and the timeline
editor — that unit tests (Vitest in `packages/ui` and `packages/services`)
cannot fully exercise. We introduced Playwright in `apps/admin` (`e2e/`,
`playwright.config.ts`) to cover whole flows end to end.

That raised three coupled questions:

1. **Where does e2e run?** The existing CI (`.github/workflows/ci.yml`) runs
   format, lint, type-check, build, and Vitest on every push/PR as required
   checks. Adding a browser suite to that gate multiplies runner minutes and
   credits across every push, and browser tests are the slowest and flakiest
   thing to block a PR on — a poor cost/value trade for a solo/small project.
2. **How is the backend provided?** The admin app's auth runs server-side
   (Server Components / Server Actions via `getServerSupabaseClient`), so
   Playwright's `page.route()` — which only intercepts browser-originated
   requests — cannot mock the auth gate. Mocking would require standing up a
   fake GoTrue/PostgREST or forging session cookies: more work, and it tests a
   fiction of the auth layer instead of the real thing.
3. **What about deployment smoke testing?** Deploys are **not** driven by
   GitHub Actions. Supabase's GitHub integration watches `main` and deploys on
   merge, so there is no Actions "deploy" step to hang a post-deploy job off,
   and (as of this ADR) no separate staging pipeline to smoke-test against.

## Decision

Adopt a **three-layer testing strategy** with e2e deliberately kept off the
per-PR gate:

| Layer                   | Tooling    | Where   | When                   | Purpose                        |
| ----------------------- | ---------- | ------- | ---------------------- | ------------------------------ |
| Unit / integration      | Vitest     | CI gate | every PR               | fast correctness gate          |
| End-to-end              | Playwright | local   | on demand, during work | flow smoke test / refactor net |
| Smoke subset (`@smoke`) | Playwright | CI      | _deferred_ — see below | deployment smoke               |

Concrete decisions:

1. **Run e2e locally against a real local Supabase**, not a mocked backend.
   The harness seeds a test user via the Supabase admin API
   (`seedTestUser()`, which relies on the `handle_new_user` trigger from
   migration `00004` to provision the matching `profiles` row), signs in
   through the **real** login form, and saves the authenticated `storageState`
   for reuse. Fidelity — real cookies, real RLS — is the point of e2e.

2. **Do not add e2e to `ci.yml`.** It is not a required check. The primary,
   already-realized value is a **local refactoring safety net** at zero CI
   cost, run via `pnpm test:e2e`.

3. **Use Playwright project dependencies, not `globalSetup`**, so the
   anonymous suite is decoupled from the `setup`/seed step (not from the app
   itself). Projects: `chromium` (anonymous — no seeded user required),
   `setup` (seeds + signs in), and `authenticated` (`dependencies: ["setup"]`,
   loads `storageState`). `pnpm test:e2e --project=chromium` runs the anon
   suite without the seed step. All e2e still assume a running local Supabase
   — the admin proxy calls `getUser()` on every request (see NEG-002).

4. **Defer the CI smoke job until the suite is worth smoking.** The real work
   is growing enough coverage of critical journeys to be worth running against
   a deployed environment. We will add a smoke job only once (a) that coverage
   exists and (b) a concrete deploy-only failure has demonstrated its value —
   not speculatively.

5. **When added, the smoke job triggers on merge to `main`, not a daily
   cron.** Deploys are event-driven (merge → Supabase deploy), so an on-merge
   trigger correlates failures to the merge that caused them and reports within
   minutes; a daily cron is decoupled, delayed up to 24h, and — being
   non-gating — risks becoming ignored noise. (A low-frequency cron may be
   added _in addition_, purely as a credential/cert **rot** detector, if it
   will actually be watched.)

## Consequences

### Positive

- **POS-001**: PRs stay fast and cheap — no browser suite on the gate, so
  runner minutes and credits are spent only on the Vitest gate that changes
  most often.
- **POS-002**: The local harness exercises the true server-side auth path
  (Server Action + `@supabase/ssr` cookie handshake + redirect), catching
  whole-flow regressions that unit tests miss — a safety net for refactoring.
- **POS-003**: The anonymous suite doesn't require the service-role seed step
  (the `setup` project), so contributors can run it — `pnpm test:e2e
--project=chromium` — without provisioning a test user.
- **POS-004**: Deferring the smoke job avoids building and maintaining a
  non-gating check whose value is unproven; it can be added cheaply later.

### Negative

- **NEG-001**: No automated coverage of the deployed environment until the
  smoke job is built — deploy-only regressions (env/config drift, migration
  fallout on the live DB) are caught manually.
- **NEG-002**: e2e depends on a running local Supabase and a seeded user, so it
  is heavier to run than Vitest and is not enforced by any hook or CI check —
  running it is a matter of discipline.
- **NEG-003**: The harness seeds via the service-role key. That is fine against
  a throwaway local DB, but the future smoke job must **not** carry that key or
  seed a shared environment (see IMP-002).

## Alternatives Considered

### e2e on every PR

- **ALT-001**: **Description**: Add the Playwright suite to `ci.yml` as a
  required check on every push/PR.
- **ALT-002**: **Rejection Reason**: Multiplies the slowest, flakiest tests
  across every push; burns credits on a solo project to re-prove flows that
  rarely change. The value of e2e is a refactor net and a deploy smoke, neither
  of which requires per-PR execution.

### Mock the Supabase backend

- **ALT-003**: **Description**: Avoid a real DB by intercepting Supabase calls
  (`page.route()`) or standing up a fake GoTrue/PostgREST.
- **ALT-004**: **Rejection Reason**: Auth is server-side, so `page.route()`
  cannot see it; a fake backend re-implements a fiction of the auth layer and
  is more work than booting local Supabase, defeating the fidelity that makes
  e2e worthwhile.

### Daily cron smoke test

- **ALT-005**: **Description**: A scheduled workflow that runs the smoke subset
  against the deployed environment once a day.
- **ALT-006**: **Rejection Reason**: Decoupled from the merge/deploy that
  changes state — delayed and unattributable signal. When we do add a smoke
  job, an on-merge trigger is strictly more valuable at comparable cost.

## Implementation Notes

- **IMP-001**: Current layout — `apps/admin/e2e/` (`support/` for
  `env.ts`, `test-user.ts`, `auth.setup.ts`; `authenticated/` for signed-in
  specs; top-level specs are anonymous). `playwright.config.ts` loads
  `.env.local` via `process.loadEnvFile` (non-fatal if absent, for CI) and
  boots `pnpm run dev` as its `webServer`. `storageState` is written to a
  gitignored `e2e/.auth/`. Scripts: `test:e2e`, `test:e2e:ui`,
  `test:e2e:report`.
- **IMP-002**: When the smoke job is built, it will differ from the local
  harness: env-driven `baseURL` pointing at the deployed app and **no**
  `webServer`; a **pre-provisioned, disposable** test account with credentials
  in CI secrets (skip the admin-API seed so the **service-role key never enters
  that job**); a **read-only** `@smoke`-tagged subset to avoid polluting a
  shared environment; and a readiness poll / retries to absorb the
  merge→deploy race (or trigger off a GitHub `deployment_status` event if the
  Supabase integration emits one).
- **IMP-003**: Success criteria — the local suite reliably catches auth/flow
  regressions during refactors; the smoke job (once added) turns red on a
  broken deploy and is actually watched. If a non-gating check is chronically
  red and ignored, remove it rather than let it erode trust in CI.
- **IMP-004**: **Test-data lifecycle** (#355). Per-fixture `afterAll` cleanups
  key on an in-memory `Date.now()` stamp, so an interrupted run takes the stamp
  with it and strands its rows for good. Two prefix-wide sweeps
  (`e2e/support/cleanup.ts`) backstop them, extending decision 3's
  project-dependency mechanism rather than reaching for `globalTeardown`:
  - **on entry**, from the `setup` project, reclaiming the previous run's rows —
    this is what makes a crash or `Ctrl-C` recoverable;
  - **on exit**, from a `cleanup` teardown project referenced by both `setup`
    and the anonymous `chromium` project (`chromium` needs its own reference,
    since decision 3 deliberately leaves it independent of `setup`). This pass
    also deletes the seeded editor account, so a completed run leaves no e2e
    residue in `auth.users` or `profiles`; `seedTestUser` recreates it (and,
    via the migration-00004 trigger, its profile) at the start of the next run.

  Two rules any cleanup must follow. **Delete events before timelines**:
  `events.timeline_id` and `events.detail_timeline_id` are both
  `ON DELETE SET NULL` (migrations 00001, 00017 — so deleting a sub-timeline
  detaches a drill-down instead of cascading), which means deleting a timeline
  first strands its events with both columns nulled rather than removing them.
  **Scope a sweep to what its own worker created**: `fullyParallel` runs
  `beforeAll`/`afterAll` once per worker and splits a multi-test spec across
  them, so a blanket prefix delete from one worker can pull a record out from
  under another. The entry sweep's auth-user pass carries an age floor for the
  same reason — the anonymous project runs concurrently with `setup`.

## References

- **REF-001**: Builds on the CI gate in `.github/workflows/ci.yml`; the profile
  trigger the seed relies on is documented at
  [ADR-0017](adr-0017-auth-bootstrap-supporting-tables.md) and implemented in
  `supabase/migrations/00004_is_admin_and_profile_trigger.sql`.
- **REF-002**: Auth data-flow context — [ADR-0021](adr-0021-tanstack-query-zustand.md)
  (server/client state split) and the `@supabase/ssr` cookie handshake in
  `apps/admin/app/auth/_lib/server-supabase.ts`.
- **REF-003**: Playwright test runner and project-dependency pattern
  (`https://playwright.dev/docs/test-projects`).
