---
title: "ADR-0037: Global unsaved-changes guard for app-shell navigation"
status: "Accepted"
date: "2026-07-10"
authors: "Admin app team"
tags: ["architecture", "decision", "frontend", "state-management"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0037: Global unsaved-changes guard for app-shell navigation

## Status

**Accepted**

## Context

Every admin editor (timeline, event, period, story, character, and the category
inspector) warns before losing unsaved edits — but the shared
`useUnsavedChangesGuard` (`apps/admin/lib/use-unsaved-changes-guard.ts`) only
intercepts navigations a caller explicitly routes through `requestNavigate(...)`,
plus a `beforeunload` backstop for hard navigation. That covers the editor's own
Cancel/breadcrumb controls and the category manager's tree-node / "New category"
navigations (ADR-context #370), but **not** navigation through the app shell:
the sidebar, the topbar quick-create menu, and the header breadcrumbs. Those
render `<Link>`s whose clicks never pass through `requestNavigate`, so unsaved
edits were silently discarded across _every_ editor.

The App Router historically had no supported API to intercept arbitrary in-app
navigation, which is why the original guard punted on shell links. Two facts make
this now tractable: (1) every shell nav surface renders through a single injected
`LinkComponent` (`ShellLink`), so there is one choke point; and (2) Next 16's
`<Link onNavigate>` fires on client-side navigation and can `preventDefault()` it —
an official API, no monkeypatching `router.push`.

## Decision

Intercept shell navigation via `<Link onNavigate>`, backed by a global Zustand
"is any editor dirty?" registry, resolved by a single app-level discard dialog.

- **Global dirty registry** in `useUiStore` (`packages/ui/src/stores/ui-store.ts`):
  `dirtyEditors: Set<string>` with `setEditorDirty(id, dirty)`, plus
  `pendingNavigation: string | null` with `requestShellNavigate` /
  `cancelShellNavigate` / `confirmShellNavigate`. Both fields are transient and
  excluded from persistence. Keyed by a stable `useId` so overlapping mounts /
  route transitions ref-count rather than clobber each other's flag.
- **Shared registration hook** `useRegisterUnsavedChanges(isDirty)`
  (`apps/admin/lib/use-register-unsaved-changes.ts`) syncs an editor's dirty
  state into the registry and clears it on unmount. It also owns the
  `beforeunload` backstop, so hard-navigation coverage lives in one place. Every
  editor calls it: the five form-clients pass `form.formState.isDirty`; the
  category manager shell passes the `isDirty` it already receives from the
  inspector via `editor-guard-context`.
- **`ShellLink` interception**: reads `dirtyEditors.size > 0` from the store and
  adds `onNavigate={(e) => { if (dirty) { e.preventDefault(); requestShellNavigate(href); } }}`.
  Self-contained in the app-layer adapter — `packages/ui/src/components/shell.tsx`
  is untouched.
- **One app-level discard dialog** in `ProtectedShell`, driven by
  `pendingNavigation`: _Keep editing_ cancels; _Discard_ clears the registry and
  performs `router.push(pendingNavigation)`. The push happens in the event
  handler, never inside a state updater (see NEG-002).

The local `useUnsavedChangesGuard` is **retained** for the surfaces `onNavigate`
can't see: in-editor Cancel/breadcrumb controls and the category manager's
tree-node / "New category" navigations (those are `router.push`, not `<Link>`).
The two mechanisms are complementary; the single global dialog and the per-editor
local dialogs never both fire for one click.

## Consequences

### Positive

- **POS-001**: Closes the shell-navigation hole for all editors at once, at a
  single choke point, with no per-editor duplication.
- **POS-002**: Uses an official Next API (`onNavigate`) rather than monkeypatching
  the router or the DOM — robust across Next internal changes.
- **POS-003**: The dirty registry is a reusable global-state primitive; new nav
  surfaces are covered for free as long as they route through `ShellLink`.

### Negative

- **NEG-001**: Browser back/forward (popstate) remains **unguarded** —
  `onNavigate` does not fire for it and the App Router still has no supported
  popstate-blocking API; `beforeunload` doesn't cover SPA popstate either. A
  `history.pushState` sentinel hack is possible but fragile and out of scope.
  Accepted limitation.
- **NEG-002**: The confirm path must `router.push` in the event handler, not in a
  Zustand updater (an updater runs during render; navigating there triggers a
  Router update mid-render — the regression fixed in 83c95e3). Encoded as a
  convention, guarded by the e2e console-error assertion.

## Alternatives Considered

### B — Monkeypatch `router.push` / global click interception on `document`

- **ALT-001**: **Description**: Wrap the router or capture link clicks at the
  document level to detect navigation.
- **ALT-002**: **Rejection Reason**: Fragile, fights the framework, breaks on
  Next internals. Rejected in favour of the official `onNavigate` API.

### C — Per-editor duplication of shell-link handling

- **ALT-003**: **Description**: Each editor handles shell links itself.
- **ALT-004**: **Rejection Reason**: Doesn't centralize; every new nav surface
  reopens the gap. Rejected.

## Implementation Notes

- **IMP-001**: `setEditorDirty` rebuilds the `Set` on each change so the reference
  changes and Zustand subscribers re-render.
- **IMP-002**: Coverage after this change — sidebar, quick-create, breadcrumbs,
  in-editor Cancel/breadcrumb, category tree-node / New category, and
  reload/tab-close are all guarded; only popstate is not.
- **IMP-003**: Verified by unit tests (registry reducer, registration hook,
  `ShellLink`) and an e2e spec that makes an editor dirty, clicks a sidebar link,
  and asserts the dialog plus the "no push during render" console-error regression.

## References

- **REF-001**: #371 (this decision), #370 (per-editor guard + category editor guard).
- **REF-002**: `apps/admin/lib/use-unsaved-changes-guard.ts`,
  `apps/admin/lib/use-register-unsaved-changes.ts`,
  `packages/ui/src/stores/ui-store.ts`, `apps/admin/components/shell-link.tsx`.
- **REF-003**: ADR-0021 (TanStack Query + Zustand state split); commit 83c95e3
  (render-phase `setState` fix).
