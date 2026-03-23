# Task: Fix .squad Configuration Consistency

You are working in the Time Traveler project at the repository root. The `.squad/` folder configures a multi-agent team. A review found 9 issues with the `agent.json` files and skill assignments. Your job is to apply all fixes described below, then verify the result.

**Do not modify any charter.md, history.md, team.md, routing.md, ceremonies.md, or SKILL.md files.** Only modify or create `agent.json` files.

---

## Background

The squad has 5 agents (Cooper, Brand, TARS, Romilly, Scribe) and 35 skills in `.squad/skills/`. Each agent has an `agent.json` with `skill_filters` controlling which skills it can use. The current configs have inconsistencies: missing fields, unassigned skills, an invalid file reference, and a missing `agent.json`.

---

## Changes to Apply

### 1. Overwrite `.squad/agents/cooper/agent.json`

Cooper is the Lead — architecture, scope, planning, code review. The current file is missing the `name` field, has no `exclude` list, and is missing all the planning/breakdown skills the Lead role needs.

Write this exact content:

```json
{
  "name": "Cooper",
  "skill_filters": {
    "include": [
      "agentic-eval",
      "breakdown-epic-arch",
      "breakdown-feature-prd",
      "breakdown-plan",
      "cloud-design-patterns",
      "context-map",
      "create-architectural-decision-record",
      "create-github-issues-feature-from-implementation-plan",
      "create-github-issues-for-unmet-specification-requirements",
      "create-github-pull-request-from-specification",
      "create-readme",
      "create-specification",
      "devops-rollout-plan",
      "documentation-writer",
      "doublecheck",
      "gen-specs-as-issues",
      "gh-cli",
      "prd",
      "project-conventions",
      "update-specification"
    ],
    "exclude": [
      "frontend-design",
      "premium-frontend-ui",
      "postgresql-code-review",
      "postgresql-optimization",
      "javascript-typescript-jest",
      "webapp-testing",
      "web-coder",
      "web-design-reviewer"
    ]
  }
}
```

### 2. Overwrite `.squad/agents/tars/agent.json`

TARS is the Backend Dev — Supabase, PostgreSQL, Edge Functions, migrations. The current file has an invalid `"charter": "backend-dev.md"` field (the file is actually `charter.md` by convention — remove the field entirely). TARS only had 2 included skills despite owning the entire backend. Add `project-conventions`, `dependabot`, `gh-cli`, and `refactor`.

Write this exact content:

```json
{
  "name": "TARS",
  "model": "claude-sonnet-4.5",
  "skill_filters": {
    "include": [
      "dependabot",
      "gh-cli",
      "postgresql-code-review",
      "postgresql-optimization",
      "project-conventions",
      "refactor"
    ],
    "exclude": [
      "breakdown-test",
      "create-architectural-decision-record",
      "frontend-design",
      "javascript-typescript-jest",
      "premium-frontend-ui",
      "web-coder",
      "web-design-reviewer",
      "webapp-testing"
    ]
  }
}
```

### 3. Overwrite `.squad/agents/brand/agent.json`

Brand is the Frontend Dev — Next.js, React, UI, visualization. Was missing `project-conventions` (contains all the Next.js/Tailwind/state management conventions), `deploy-to-vercel`, `gh-cli`, and `refactor`. Clean up the exclude list to remove `breakdown-test` (redundant — not in includes).

Write this exact content:

```json
{
  "name": "Brand",
  "model": "claude-sonnet-4.5",
  "skill_filters": {
    "include": [
      "deploy-to-vercel",
      "frontend-design",
      "gh-cli",
      "premium-frontend-ui",
      "project-conventions",
      "refactor",
      "vercel-composition-patterns",
      "vercel-react-best-practices",
      "web-coder",
      "web-design-reviewer"
    ],
    "exclude": [
      "agentic-eval",
      "cloud-design-patterns",
      "context-map",
      "create-architectural-decision-record",
      "create-specification",
      "documentation-writer",
      "javascript-typescript-jest",
      "postgresql-code-review",
      "postgresql-optimization",
      "prd",
      "update-specification",
      "webapp-testing"
    ]
  }
}
```

### 4. Overwrite `.squad/agents/romilly/agent.json`

Romilly is the Tester — QA, edge cases, temporal validation. Was missing the `name` field, had no `exclude` list, and was missing QA-adjacent skills (`codeql` for static analysis, `doublecheck` for verification, `project-conventions` for knowing what correct behavior looks like).

Write this exact content:

```json
{
  "name": "Romilly",
  "skill_filters": {
    "include": [
      "breakdown-test",
      "codeql",
      "doublecheck",
      "javascript-typescript-jest",
      "project-conventions",
      "webapp-testing"
    ],
    "exclude": [
      "cloud-design-patterns",
      "create-architectural-decision-record",
      "frontend-design",
      "premium-frontend-ui",
      "postgresql-optimization",
      "web-coder",
      "web-design-reviewer"
    ]
  }
}
```

### 5. Create `.squad/agents/scribe/agent.json` (new file)

Scribe is the Session Logger — background agent for logging, decision merging, and cross-agent updates. It's the only agent without an `agent.json`. Create one for consistency. Scribe has no skills.

Write this exact content:

```json
{
  "name": "Scribe",
  "skill_filters": {
    "include": [],
    "exclude": []
  }
}
```

---

## Do NOT Change

- Any `charter.md` files — they are correct as-is
- Any `history.md` files — those are runtime logs
- `.squad/team.md` — Ralph is listed but intentionally has no agent directory yet
- `.squad/routing.md`, `.squad/ceremonies.md`, `.squad/decisions.md`
- Any files in `.squad/skills/`
- `skills-lock.json` — lock file drift is a known issue but out of scope for this task

---

## Verification Checklist

After applying all changes, verify:

1. Every agent directory (brand, cooper, tars, romilly, scribe) contains an `agent.json`
2. Every `agent.json` has a `name` field matching the agent's directory name (capitalized)
3. Every `agent.json` has `skill_filters` with both `include` and `exclude` arrays
4. No `agent.json` has a `charter` field (removed from TARS)
5. Only Brand and TARS have `"model": "claude-sonnet-4.5"` — Cooper, Romilly, and Scribe intentionally omit it (use default)
6. `project-conventions` appears in the `include` list of Cooper, TARS, Brand, and Romilly
7. `gh-cli` appears in the `include` list of Cooper, TARS, and Brand
8. No skill appears in both `include` and `exclude` for the same agent
9. The following skills are assigned to at least one agent: `breakdown-epic-arch`, `breakdown-feature-prd`, `breakdown-plan`, `codeql`, `create-github-issues-feature-from-implementation-plan`, `create-github-issues-for-unmet-specification-requirements`, `create-github-pull-request-from-specification`, `create-readme`, `dependabot`, `deploy-to-vercel`, `devops-rollout-plan`, `doublecheck`, `gen-specs-as-issues`, `gh-cli`, `refactor`
