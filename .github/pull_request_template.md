## Summary

<!-- Describe the change and why it was made. One or two sentences. -->

Closes #<!-- issue number -->

## Type of change

<!-- Check all that apply -->

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no functional change)
- [ ] Database schema change (migration + RLS + grants)
- [ ] Documentation / ADR
- [ ] CI / tooling / configuration
- [ ] Security fix

## Affected areas

<!-- Check all that apply — these map to the auto-labeler in .github/labeler.yml -->

- [ ] `apps/admin`
- [ ] `apps/reader`
- [ ] `apps/docs`
- [ ] `packages/ui` (`@repo/ui`)
- [ ] `packages/services` (`@repo/services`)
- [ ] `supabase/` (migrations, RLS, pgTAP tests)
- [ ] `docs/` (design, ADRs, PRD, system design)
- [ ] `.github/` (CI, workflows, config)

## Pre-submission checklist

<!-- Run these locally before opening the PR. All must pass. -->

- [ ] `pnpm run format` — ran Prettier (required before `git add` to pass the pre-commit hook)
- [ ] `pnpm run check-types` — TypeScript compiles with no errors
- [ ] `pnpm run lint` — zero ESLint errors or warnings (`--max-warnings 0`)
- [ ] `pnpm run test:coverage` — all tests pass with ≥80% coverage
- [ ] `pnpm run build` — Turborepo build succeeds

If this PR includes **database changes**, also:

- [ ] New migration file is numbered sequentially and created via `pnpm run db:gen:migration <name>`
- [ ] Migration enables RLS, adds policies, and includes explicit `GRANT` statements for `anon`, `authenticated`, and `service_role` ([ADR-0034](../docs/adr/adr-0034-api-role-table-grants.md))
- [ ] `pnpm run db:reset && pnpm run db:test` — all pgTAP tests pass locally

If this PR makes a **hard-to-reverse or cross-cutting architectural decision**:

- [ ] New ADR created and added to `docs/adr/README.md` index

## Screenshots / recordings

<!-- If this PR changes UI, include before/after screenshots or a short screen recording. Delete this section if not applicable. -->

## Notes for reviewers

<!-- Anything that needs extra attention, known trade-offs, follow-up issues, or `// DECISION NEEDED` items left in the code. -->
