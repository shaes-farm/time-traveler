# Time Traveler Custom Agents: Comprehensive Guide

This guide consolidates the custom expert agents created in this session and provides an operating reference for using, tuning, and extending them.

## 1. Agent Fleet Overview

Current agent files:

1. [UX Designer Expert](../.github/agents/ux-designer-expert.agent.md)
2. [Backend Supabase Expert](../.github/agents/backend-supabase-expert.agent.md)
3. [Frontend Next.js Expert](../.github/agents/frontend-nextjs-expert.agent.md)
4. [QA Engineer Expert](../.github/agents/qa-engineer-expert.agent.md)
5. [System Architect Expert](../.github/agents/system-architect-expert.agent.md)
6. [DevOps Engineer Expert](../.github/agents/devops-engineer-expert.agent.md)

Shared frontmatter baseline across all six:

1. `tools: [read, search, edit, execute, todo]`
2. `model: "GPT-5 (copilot)"`
3. `user-invocable: true`
4. Rich role descriptions and argument hints for accurate discovery and invocation.

## 2. What Each Agent Is Tuned For

### 2.1 UX Designer Expert

Primary fit:

1. UX/UI work in `apps/admin` and `apps/docs`.
2. Interaction and IA improvements.
3. Accessibility and responsive behavior quality.
4. Visual consistency aligned to repo design artifacts.

Distinctive tuning:

1. Design-system reuse via `@repo/ui` before one-off component creation.
2. Strong UX quality standards across loading/empty/error/success states.
3. Product-minded workflow from diagnosis to implementation-ready fixes.

### 2.2 Backend Supabase Expert

Primary fit:

1. Supabase/PostgreSQL schema and migration work.
2. RLS policies and authorization correctness.
3. SQL function and query-quality work.
4. Service-layer and generated-type consistency.

Distinctive tuning:

1. Migration-first and authorization-safe approach.
2. Explicit handling of temporal model and route/ownership constraints.
3. Alignment between migration changes, tests, and typed service contracts.

### 2.3 Frontend Next.js Expert

Primary fit:

1. Next.js App Router and React 19 implementation/refactoring.
2. Route/layout composition.
3. Server/client component boundary decisions.
4. Shared UI integration and accessibility-safe frontend delivery.

Distinctive tuning:

1. Server-components-first mindset.
2. Guardrails around route contracts and bundle boundaries.
3. Clear emphasis on maintainability and performance.

### 2.4 QA Engineer Expert

Primary fit:

1. Risk-based QA planning and execution.
2. Regression analysis and acceptance-criteria verification.
3. Accessibility and reliability validation.
4. Evidence-first findings and test-gap identification.

Distinctive tuning:

1. Explicit distinction between verified and inferred behavior.
2. Focused checks before broad suites.
3. Clear command guidance aligned with current repo testing maturity.

### 2.5 System Architect Expert

Primary fit:

1. Cross-cutting architecture decisions.
2. Cloud application architecture and trade-offs.
3. Service/data boundaries and non-functional requirement balancing.
4. ADR/spec/plan alignment and architecture governance.

Distinctive tuning:

1. Hard-to-reverse decision discipline.
2. Option analysis before recommendation.
3. Explicit expectation of architecture-document updates.

### 2.6 DevOps Engineer Expert

Primary fit:

1. CI/CD design and deployment safety.
2. Vercel deployment strategy and environment management.
3. Release reliability and rollback readiness.
4. Alignment between deployment docs and real automation state.

Distinctive tuning:

1. Current-state realism (CI exists, deployment workflow not yet committed).
2. Progressive delivery posture.
3. Strong environment/secret and operational safety orientation.

## 3. Session-Defined Parts to Finalize

This section captures the explicit open decisions raised during this session.

### 3.1 System Architect Expert

1. Tool strictness:
   Keep `execute` enabled for validation and architecture checks, or restrict to read/search/edit for design-only mode?
2. Decision authority:
   Default to options-only, or provide a direct recommendation when constraints are clear?
3. ADR behavior:
   Proactively draft ADR updates for load-bearing changes, or only when requested?
4. Scope focus:
   System-level architecture only, or include module-level architectural refactors?

### 3.2 DevOps Engineer Expert

1. Tool strictness:
   Keep `execute` enabled for deployment/runbook validation, or move to design-only mode?
2. Scope boundary:
   Include security-adjacent workflow changes (CodeQL/Dependabot/secret scanning), or split to a separate specialist?
3. Deployment authority:
   Propose plans only, or generate/edit workflow files by default?
4. Environment model:
   Assume preview+production only, or require explicit staging in recommendations?

### 3.3 Fleet-Wide Optional Finalization

This was suggested as next tuning work:

1. Keep all experts user-invocable, or set some to subagent-only mode.
2. Keep broad shared tool sets, or move to role-specific least-privilege tools.
3. Keep role-local output formats, or standardize one cross-agent response contract.
4. Keep broad skill references, or tighten to minimal strict role-based skill lists.

## 4. Example Prompts

### 4.1 UX Designer Expert

1. Audit the timeline detail UX for information scent, keyboard flow, and mobile clarity, then propose concrete `@repo/ui`-aligned fixes.
2. Redesign the relationship editing interaction to reduce cognitive load while preserving current IA and schema constraints.
3. Review this route’s loading/empty/error states and propose accessibility-safe hierarchy and copy improvements.

### 4.2 Backend Supabase Expert

1. Design a migration and RLS update for collaborator-scoped access without weakening owner/admin controls.
2. Review this query path for indexing and policy risks, then propose minimal safe schema deltas.
3. Add a temporal metadata extension and keep generated service types aligned.

### 4.3 Frontend Next.js Expert

1. Refactor this route to a server-components-first implementation while preserving behavior.
2. Evaluate this App Router segment tree for boundary leaks and unnecessary client bundling.
3. Implement route-level loading/error patterns aligned to design docs and shared primitives.

### 4.4 QA Engineer Expert

1. Build a risk-based test matrix for this feature and map each acceptance criterion to validation evidence.
2. Run focused regression checks for this PR and report only high-confidence findings with reproduction steps.
3. Recommend the smallest high-impact test additions for current coverage gaps.

### 4.5 System Architect Expert

1. Evaluate whether current public-reader app placement still aligns with ADR constraints and propose migration options if not.
2. Propose an architecture plan for adding reader runtime observability across frontend and Supabase.
3. Review this feature plan for coupling risks across App Router, services package, and schema boundaries.
4. Draft a decision comparison for adding an event indexing strategy under current PostgREST and RLS constraints.
5. Create a phased architecture roadmap from current boilerplate-heavy apps toward production-ready surfaces.

### 4.6 DevOps Engineer Expert

1. Audit current CI against deployment strategy and propose a minimal Vercel preview + production rollout workflow.
2. Design a safe promotion flow for `apps/admin` and `apps/docs` with rollback and environment protections.
3. Create a deployment runbook for Vercel + Supabase migration sequencing for main releases.
4. Review GitHub Actions permissions and secrets handling for least privilege before adding deploy jobs.
5. Propose a phased plan to introduce `apps/reader` as an independent Vercel project when added.

## 5. What to Create Next

### 5.1 Session-Defined Next Customizations

1. System architecture review prompt with fixed trade-off matrix and risk rubric.
2. ADR quality-check agent/prompt for supersession/amendment correctness.
3. Topology mapping prompt that snapshots architecture from docs + workspace structure.
4. Vercel Release Manager agent for release orchestration and rollback decision trees.
5. Deployment Docs Sync prompt/agent that diffs implementation vs `docs/system-design.md`.
6. CI Security Gatekeeper agent for CodeQL/Dependabot/secret-scanning policy enforcement.

### 5.2 Additional High-Value Additions

1. Product/Requirements specialist to bridge planning-to-implementation handoff quality.
2. Security-review specialist focused on authz, secrets, and supply-chain controls.
3. Data quality steward for migration/seed/test-fixture consistency and analytics schema drift.

## 6. Current Gaps

### 6.1 Agent Configuration Gaps

1. No explicit `agents` allowlists to constrain delegation topology.
2. No `handoffs` metadata for predictable role transitions.
3. No model fallback arrays for resilience.
4. No role-specific hooks for optional pre/post safety checks.

### 6.2 Workflow Gaps

1. No committed deploy workflow file despite deployment strategy docs describing preview/production paths.
2. No canonical multi-agent orchestration playbook checked into docs.
3. No single fleet policy defining invocation boundaries for each specialist.

### 6.3 Validation Gaps

1. No dedicated quality checks for `.agent.md` consistency and completeness.
2. No periodic behavior-evaluation routine for agent output quality.
3. No explicit per-agent acceptance criteria for what “good output” means.

## 7. Improvements and Enhancements Roadmap

### 7.1 Near-Term

1. Add docs-level invocation and handoff conventions for all six experts.
2. Tighten tool permissions by role where possible.
3. Standardize section ordering and explicit non-goals across agent definitions.
4. Define a minimum output contract for easier composition across specialists.

### 7.2 Mid-Term

1. Add handoff metadata and model fallback policies.
2. Introduce optional hooks for high-risk workflows.
3. Add docs-sync automation between ADR/spec/workflow changes and agent context.
4. Establish a repeatable review cadence for role overlap and drift.

### 7.3 Long-Term

1. Build scorecards/rubrics for architecture, UX, QA, and DevOps output quality.
2. Add role-specific runbook templates for frequent workflows.
3. Introduce continuous improvement loops from historical review findings.

## 8. Practical Guide to Using These Agents

### 8.1 Picking the Right Agent

1. UX and interaction quality: UX Designer Expert.
2. Supabase, schema, migrations, policies: Backend Supabase Expert.
3. Next.js route/component architecture: Frontend Next.js Expert.
4. Validation and regression quality: QA Engineer Expert.
5. Cross-cutting technical decisions: System Architect Expert.
6. CI/CD and deployment operations: DevOps Engineer Expert.

### 8.2 Recommended Multi-Agent Sequences

Architecture-to-delivery:

1. System Architect Expert defines target and constraints.
2. Backend Supabase Expert and Frontend Next.js Expert implement in parallel by domain.
3. QA Engineer Expert validates quality and regressions.
4. DevOps Engineer Expert validates deployment/release readiness.

Deployment-hardening:

1. DevOps Engineer Expert audits and designs rollout flow.
2. System Architect Expert validates topology and long-term constraints.
3. QA Engineer Expert validates release-critical flows and rollback checks.

### 8.3 Prompting Best Practices

1. Include objective, non-goals, constraints, and acceptance criteria.
2. Name impacted files/routes/tables/workflows explicitly.
3. Specify desired mode: analysis-only, plan-only, or implementation + validation.
4. State priority risks clearly: security, reliability, usability, performance, or release safety.

## 9. Maintenance Cadence

1. After major ADR/spec updates: review agent context for drift.
2. After workflow/toolchain changes: update affected guardrails and methods.
3. Monthly: fleet overlap and ambiguity review.
4. Quarterly: tool-permission and invocation-mode reassessment.

## 10. Quick Start Checklist

1. Choose the specialist matching the dominant risk domain.
2. Provide full context and acceptance criteria.
3. Decide if you want recommendation-only or implementation-ready output.
4. Ask for explicit residual risks and follow-up work.
5. Commit durable learnings back into agent definitions and this guide.

---

If you adopt this as the canonical operating guide, update it whenever files in [.github/agents](../.github/agents/) are added or changed.
