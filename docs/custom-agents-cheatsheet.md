# Time Traveler Custom Agents: Quick Cheatsheet

Use this as the fast operational companion to the full guide in [docs/custom-agents-guide.md](docs/custom-agents-guide.md).

## 1. Which Agent to Use

1. UX and interaction quality:
   Use UX Designer Expert.
2. Supabase schema, migrations, RLS, SQL:
   Use Backend Supabase Expert.
3. Next.js App Router and React component architecture:
   Use Frontend Next.js Expert.
4. Test planning, regression checks, validation evidence:
   Use QA Engineer Expert.
5. Cross-cutting technical decisions and ADR alignment:
   Use System Architect Expert.
6. CI/CD, Vercel deployment, release safety:
   Use DevOps Engineer Expert.

## 2. Prompt Template

Copy and adapt:

```text
Objective:
Scope:
Constraints:
Acceptance criteria:
Mode: analysis-only | plan-only | implementation+validation
Priority risks: security | reliability | usability | performance | release safety
Impacted files/routes/tables/workflows:
```

## 3. Best First Prompt Per Agent

### UX Designer Expert

"Audit this flow for usability, accessibility, and responsive behavior, then propose minimal @repo/ui-aligned improvements."

### Backend Supabase Expert

"Design a safe migration and RLS update for this requirement, including data integrity risks and rollback strategy."

### Frontend Next.js Expert

"Refactor this route to server-components-first while preserving behavior and existing IA contracts."

### QA Engineer Expert

"Build a risk-based test matrix for this change and run focused validation with findings by severity."

### System Architect Expert

"Evaluate architecture options for this change, compare trade-offs, and recommend a migration path aligned to ADRs."

### DevOps Engineer Expert

"Audit current CI/CD against deployment strategy and propose a safe preview-to-production rollout design."

## 4. Fast Multi-Agent Flows

### Feature Delivery Flow

1. System Architect Expert: target architecture and constraints.
2. Backend Supabase Expert + Frontend Next.js Expert: domain implementation.
3. QA Engineer Expert: validation and regression risk.
4. DevOps Engineer Expert: deployment and release readiness.

### Deployment Hardening Flow

1. DevOps Engineer Expert: pipeline and release design.
2. System Architect Expert: topology and long-term architecture fit.
3. QA Engineer Expert: release-critical validation and rollback checks.

## 5. Open Finalization Decisions

### System Architect Expert

1. Keep execute enabled or design-only tools?
2. Options-only or recommendation-by-default?
3. Proactive ADR drafting or only on request?
4. System-level only or include module-level architecture refactors?

### DevOps Engineer Expert

1. Keep execute enabled or design-only tools?
2. Include security-adjacent workflow ownership or split specialist?
3. Propose-only or edit workflows by default?
4. Preview+production baseline or mandatory staging model?

## 6. Current Fleet Gaps

1. No explicit handoff metadata.
2. No role-specific tool restrictions yet.
3. No model fallback arrays in frontmatter.
4. No dedicated docs-sync or security-gatekeeper agent yet.
5. No committed deploy workflow file yet despite deployment strategy docs.

## 7. Highest-Value Next Customizations

1. Vercel Release Manager agent.
2. Deployment Docs Sync agent or prompt.
3. CI Security Gatekeeper agent.
4. ADR Quality Checker agent or prompt.
5. Architecture review prompt with fixed trade-off rubric.

## 8. Maintenance Cadence

1. After ADR/spec updates: refresh agent context.
2. After workflow/tooling changes: refresh guardrails.
3. Monthly: review overlap and ambiguity.
4. Quarterly: reassess permissions and invocation modes.
