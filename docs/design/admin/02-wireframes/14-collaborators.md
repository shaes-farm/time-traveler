# 14 — Collaborator Management (Timeline)

**Purpose.** Manage who else can see and edit a timeline, and at what role. Lives as the **Collaborators** tab on [timeline detail](13-timeline-detail.md). Collaboration is the one place the admin stops being single-user, so this surface is small but permission-sensitive: every action here changes what another person can do under RLS.

Scoped to **timelines only** this pass (issue #50). Characters, events, periods, and stories inherit collaborator access _derived from_ the timelines that reference them (system-design §9.2.1), so there is no separate collaborator UI for those entities.

## Data shown

- Owner (from `timelines.user_id`) — always shown, never editable, never removable
- Each collaborator (`timeline_collaborators`): profile identity (username, display name, avatar), `role` (`viewer|editor|admin`), added date
- Collaborator count (excludes owner)

## Primary actions

- Add collaborator by username + role (`addCollaborator`)
- Change a collaborator's role (`updateCollaboratorRole`)
- Remove a collaborator (`removeCollaborator`)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Collaborators (2)                                   [ + Add collaborator ]   │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  Owner                                                                       │
│  ──────────────────────────────────────────────────────────────────────────  │
│  ◑ you  ·  @Philipe Banglarian                          owner   (full control) │
│                                                                              │
│  Collaborators                                                               │
│  ──────────────────────────────────────────────────────────────────────────  │
│  ◑ Irène Joliot-Curie  ·  @irenejc        editor ▾    added 2026-05-02  [×]  │
│  ◑ Édouard Branly      ·  @ebranly        viewer ▾    added 2026-05-11  [×]  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

  ── Add collaborator (dialog) ──────────────────────────────────────────┐
  │  Add collaborator                                                     │
  │  ──────────────────────────────────────────────────────────────────  │
  │  Username                                                             │
  │  [ @irenejc                          ]  ✓ Irène Joliot-Curie         │
  │                                                                      │
  │  Role                                                                │
  │  ◯ Viewer   — can read this timeline and its events                  │
  │  ◉ Editor   — can read and edit events; cannot delete or publish     │
  │  ◯ Admin    — can edit, and manage collaborators; cannot delete the  │
  │              timeline or change the owner                            │
  │                                                                      │
  │                                        [ Cancel ]  [ Add collaborator]│
  └──────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Owner is rendered as a distinct, locked top section** — not a row in the collaborator list. The owner is `timelines.user_id`, which is _not_ a `timeline_collaborators` row, so it can never be removed or re-roled here (acceptance criterion: "owner-removal is blocked in UI"). Showing it explicitly answers "who's in charge?" without implying it's editable.
2. **Lookup is by `username`, not email** (schema reality). `profiles` exposes `username` (unique-ish, client-queryable); there is **no** client-readable email — email lives in `auth.users`, behind the service role. So "validate target user" (issue #50) means: resolve the typed `@username` against `profiles`, show the matched display name as confirmation (✓), and only enable **Add** once a real profile resolves. A non-matching username shows "No user found with that username."
   - **Resolved — profiles are globally readable.** The `read_profiles` policy is `USING (true)` (migration `00007_rls_policies.sql`), so any authenticated user can resolve a `@username` to a profile. Add-by-username works without further RLS work. (`profiles.username` has a length CHECK but is nullable, so a username search must tolerate users who never set one — they simply aren't findable this way.)
3. **Three roles map exactly to the schema CHECK** (`viewer|editor|admin`) and to the RLS helper functions (`is_timeline_collaborator`, `is_timeline_collab_editor`). The role descriptions in the dialog are the plain-language contract:
   - **Viewer** — read the timeline and its events (RLS read access).
   - **Editor** — read + update events on the timeline (`is_timeline_collab_editor`); **cannot delete** events or **publish** the timeline.
   - **Admin** — editor capabilities **plus** manage collaborators on this timeline; still **cannot delete the timeline** or change ownership (owner + global admin only).
     Spelling out the negatives ("cannot delete / publish") is deliberate — role names alone under-communicate the ceiling.
4. **Role change is an inline select per row** (`editor ▾`), applied immediately via `updateCollaboratorRole` (acceptance criterion: "role changes take effect immediately in UI"). Optimistic update with rollback on failure. No separate save step.
5. **Remove (`[×]`) requires confirmation** (issue #50): "Remove @irenejc as a collaborator? They will lose access to this timeline and its events." On confirm, `removeCollaborator` deletes the junction row.
6. **Who can manage collaborators:** the owner always; a collaborator-**admin** can add/remove/re-role _other_ collaborators but cannot remove the owner, cannot promote anyone above their own ceiling in a way that grants delete/ownership, and cannot remove themselves to orphan the timeline's management (they can leave only if the owner remains — which is always true since the owner isn't a collaborator row). Viewers and editors see the list read-only (no add/remove/role controls).
7. **No self-add, no duplicate, no adding the owner.** The add dialog disables **Add** when the resolved username is the current owner ("That user already owns this timeline") or already a collaborator ("Already a collaborator — change their role below instead"). The PK `(timeline_id, user_id)` would reject a duplicate anyway; the UI catches it first.
8. **Collaborator count surfaces in two places** (issue #50 acceptance: "count is visible where required"): the tab label here (`Collaborators (2)`) and, optionally, row line 2 on the [timelines list](11-timeline-list.md). Both exclude the owner.
9. **Avatars** come from `profiles.avatar_url`; fall back to initials when null. Display name is `first_name last_name` from `profiles`.

## Edge cases

- **Username not found.** Inline under the field: "No user found with that username." Add stays disabled.
- **Adding a user who already collaborates.** Blocked at validation with a pointer to change their role inline.
- **Adding the owner.** Blocked: "That user already owns this timeline."
- **Removing yourself (as a collaborator-admin).** Allowed — confirm "Leave this timeline? You'll lose access." After leaving, redirect to the timelines list (the page is no longer reachable for them).
- **Role downgrade mid-session for another connected user.** Out of scope for realtime sync this pass; their access updates on their next RLS-checked request. (Supabase Realtime co-presence is explicitly not designed yet — see [01-user-flows.md](../01-user-flows.md).)
- **Loading / error.** Tab-level skeleton on the collaborator list; failed add/remove/role-change rolls back the optimistic update and toasts the error.

## Non-goals (issue #50)

- **Email-invite delivery.** No "send an invitation email" flow — collaborators are added directly by username and gain access immediately under RLS. The `notifications` table (system-design §3) could later carry an in-app "you were added to a timeline" notice; that's a separate notifications-IA pass, not this ticket.
- **Organization / team-wide permissions.** No group roles; collaboration is per-timeline, per-user only.
- **Pending/invited state.** Because add is immediate, there is no "invited but not accepted" state to model in this pass.

## Open questions

- **In-app notification on add.** Worth wiring once the notifications inbox is designed — surfaces "@you were added to _Curie scientific biography_ as editor." Deferred to the notifications IA pass.
- **Username vs. email lookup.** If product wants email-based invites (the more familiar pattern), it needs a service-role lookup or an invite-token flow — a meaningfully larger feature than #50's scope. Flagged for product; username lookup is the schema-honest choice for now.
- **Profiles directory privacy.** Add-by-username assumes usernames are discoverable. If that's undesirable (privacy), an invite-token model replaces directory lookup. Tied to the annotation #2 RLS prerequisite.
