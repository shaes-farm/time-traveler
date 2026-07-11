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
  handler, never inside a state updater (see NEG-003).

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

- **NEG-001**: Browser back/forward (popstate) remains **unguarded** — accepted
  limitation, confirmed by a real attempted fix and rollback, not just a
  theoretical gap. `onNavigate` does not fire for `popstate`, and the App
  Router exposes no supported popstate-blocking API, so the only known
  technique is a `history.pushState` "sentinel" entry: push a dummy entry
  while dirty, so the first Back press pops it instead of leaving, giving a
  chance to show a confirm dialog. **This was implemented, tested against Next
  16.2.10 (Turbopack), and reverted** after it reproducibly broke Next's own
  client-side navigation: with the sentinel armed (any editor merely dirty —
  no Back press needed), a normal Save-and-redirect stopped completing. Network
  evidence showed the save mutation succeeding (`POST .../categories` → 201)
  and Next fetching the destination route's RSC payload (200), but the
  `router.push()` call itself never committed — the URL and `history.length`
  stayed unchanged. Reproduced 3× deterministically on a freshly restarted,
  fully warm dev server (ruling out compile-time/HMR races), with and without
  merging the sentinel into the existing `history.state` object rather than
  replacing it (Next stores its own internal router bookkeeping — route cache,
  scroll restoration — in `history.state`; even a careful merge didn't avoid
  the corruption). Root cause not fully diagnosed beyond that: Next's App
  Router evidently keeps additional navigation bookkeeping that a
  same-frame `window.history.pushState()` call desyncs, regardless of care
  taken with the `state` payload. **This is a routing-internals conflict, not
  an edge case in our own code** — no variant of directly calling the History
  API from application code was found safe against this Next version. A future
  attempt should first verify against the Next version in use at that time,
  since this depends on undocumented App Router internals that can change
  across releases.
- **NEG-002**: Reload, tab close, and browser close are **not** part of the
  NEG-001 gap — they're covered by the existing `beforeunload` backstop
  (`useRegisterUnsavedChanges`), confirmed working: the native dialog fires and
  reliably blocks the reload when declined. `beforeunload` fires on all three
  (they're the same underlying browser event) and doesn't touch the History
  API, so it's unaffected by the NEG-001 finding. Two browser-level caveats
  apply regardless of our implementation: the dialog's text can't be
  customized (always the browser's generic message), and Chrome requires
  "sticky user activation" (a prior real interaction with the page) for the
  dialog to fire at all — a page where the user never clicked/typed before
  attempting to close it may not show it. Neither is something application
  code can work around.
- **NEG-003**: The confirm path must `router.push` in the event handler, not in a
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

### D — `history.pushState` sentinel entry for popstate (attempted, reverted)

- **ALT-005**: **Description**: While any editor is dirty, push one extra
  history entry at the current URL (merging into, not replacing, Next's
  existing `history.state`). The first Back press pops the sentinel — same URL,
  so Next's router has nothing to reconcile — which is the chance to show the
  same discard dialog before a second, real Back is let through. Implemented as
  `apps/admin/lib/use-popstate-guard.ts`, mounted once in `ProtectedShell`,
  reusing the existing dirty registry and dialog.
- **ALT-006**: **Rejection Reason**: Confirmed broken against Next 16.2.10 —
  see NEG-001 for the reproducible evidence (a normal Save-and-redirect stops
  completing the moment the sentinel is armed, independent of any Back press).
  Not a theoretical fragility judgment; an observed regression. Reverted in
  full before merge; no trace remains in shipped code.

### E — Popstate `confirm()` + monkeypatched `router.push` (proposed externally, not attempted)

- **ALT-007**: **Description**: A commonly-suggested pattern — on `popstate`,
  call blocking `window.confirm()` and, if declined, call
  `history.pushState(null, "", location.href)` to "undo" the Back; separately,
  reassign `router.push` on the object returned by `useRouter()` to gate
  programmatic navigation behind the same `confirm()`.
- **ALT-008**: **Rejection Reason**: Two independent problems, neither novel to
  this ADR. First, its `router.push` override is Alternative B (ALT-001/002)
  restated — reassigning a method on a hook-returned object doesn't reliably
  intercept navigation Next itself triggers internally (e.g. via `<Link>`,
  form actions, `router.refresh()`), and mutating that object at all is
  unsupported by the App Router's public API. Second, its popstate handler
  calls `history.pushState(null, "", url)` — replacing `history.state` with
  `null` outright rather than merging it — which is strictly more destructive
  to Next's internal bookkeeping than the merged-state variant already
  disproven in ALT-006, and would be expected to reproduce the same failure
  (or worse). Its own documented caveats (a visible URL "flicker," and no
  guaranteed ordering between its listener and Next's internal popstate
  listener) are the same listener-ordering race NEG-001 already identified.
  Not attempted, given ALT-006's direct evidence that the underlying technique
  — an application calling the History API directly alongside Next's App
  Router — doesn't hold up.

## Implementation Notes

- **IMP-001**: `setEditorDirty` reads the `set()` updater's own `state`
  argument (not the outer `get()`) to build the new `Set`, and no-ops —
  skipping the rebuild and the subscriber notification — when the requested
  flag already matches, so idempotent calls are free.
- **IMP-002**: Coverage after this change — sidebar, quick-create, breadcrumbs,
  in-editor Cancel/breadcrumb, category tree-node / New category, and
  reload/tab-close/browser-close are all guarded; only popstate (Back/Forward)
  is not, and is expected to remain so (see NEG-001/ALT-006, NEG-002).
- **IMP-003**: Verified by unit tests (registry reducer, registration hook,
  `ShellLink`) and an e2e spec that makes an editor dirty, clicks a sidebar link,
  and asserts the dialog plus the "no push during render" console-error regression.
  The `beforeunload` reload/close path was separately confirmed via a live
  Playwright run observing the native dialog fire and block the reload (see
  NEG-002).

## References

- **REF-001**: #371 (this decision), #370 (per-editor guard + category editor guard).
- **REF-002**: `apps/admin/lib/use-unsaved-changes-guard.ts`,
  `apps/admin/lib/use-register-unsaved-changes.ts`,
  `packages/ui/src/stores/ui-store.ts`, `apps/admin/components/shell-link.tsx`.
- **REF-003**: ADR-0021 (TanStack Query + Zustand state split); commit 83c95e3
  (render-phase `setState` fix).
