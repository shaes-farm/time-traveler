"use client";

import * as React from "react";
import { Check, Loader2, Plus, X } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

/**
 * CollaboratorList — manage a timeline's collaborators (screen 14).
 *
 * The **owner** is `timelines.user_id` (not a `timeline_collaborators` row), so
 * it is rendered as a distinct, locked top section — never removable, never
 * re-rolled. Collaborators are added by `profiles.username`, resolved to a real
 * profile through the injected `resolveUsername` callback (the component stays
 * presentational — no hooks or Supabase client). Add/remove/role controls are
 * gated by `canManage`; non-managers get a read-only list.
 */
export type CollaboratorRole = "viewer" | "editor" | "admin";

export interface Collaborator {
  /** The collaborator's `user_id`. */
  id: string;
  username: string;
  displayName: string;
  role: CollaboratorRole;
  avatarUrl?: string;
  /** ISO timestamp the collaborator was added (`created_at`). */
  addedAt?: string;
}

export interface CollaboratorOwner {
  displayName: string;
  username: string | null;
  avatarUrl?: string;
}

/** Shape returned by `resolveUsername` when a `@username` matches a profile. */
export interface ResolvedProfile {
  /** The resolved `user_id`, passed straight to `onAdd`. */
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
}

export interface CollaboratorListProps {
  collaborators: Collaborator[];
  /** The timeline owner — rendered as a locked top section. */
  owner: CollaboratorOwner;
  /** The owner's `user_id`, used to block adding the owner as a collaborator. */
  ownerUserId: string;
  /** Gate for add/remove/role controls (owner-only today). Defaults to true. */
  canManage?: boolean;
  /**
   * Resolve a typed `@username` to a profile (or `null` when none matches).
   * Required for the add dialog; omit only when `canManage` is false.
   */
  resolveUsername?: (username: string) => Promise<ResolvedProfile | null>;
  /** Called with the **resolved user_id** (not the username) and chosen role. */
  onAdd?: (userId: string, role: CollaboratorRole) => void;
  onRemove?: (userId: string) => void;
  onRoleChange?: (userId: string, role: CollaboratorRole) => void;
  className?: string;
}

const ROLE_OPTIONS: {
  value: CollaboratorRole;
  label: string;
  description: string;
}[] = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can read this timeline and its events.",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can read and edit events; cannot delete or publish.",
  },
  {
    value: "admin",
    // Today a collaborator-admin's effective ceiling equals editor: collaborator
    // management is owner-only under current RLS (see #237). Describe only what
    // the role grants now, not the future management capability.
    label: "Admin",
    description:
      "Can read and edit events; cannot delete or publish. Managing collaborators is owner-only for now.",
  },
];

const SELECT_CLASS =
  "h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function CollaboratorList({
  collaborators,
  owner,
  ownerUserId,
  canManage = true,
  resolveUsername,
  onAdd,
  onRemove,
  onRoleChange,
  className,
}: CollaboratorListProps) {
  const [adding, setAdding] = React.useState(false);
  const [pendingRemoveId, setPendingRemoveId] = React.useState<string | null>(
    null,
  );

  const confirmRemove = () => {
    if (pendingRemoveId) {
      onRemove?.(pendingRemoveId);
      setPendingRemoveId(null);
    }
  };

  const pendingCollaborator =
    pendingRemoveId === null
      ? null
      : collaborators.find((c) => c.id === pendingRemoveId);

  // Adding requires both management rights and a way to resolve usernames; without
  // a resolver the add dialog could never reach a "found" state, so hide it.
  const canAddCollaborators = canManage && resolveUsername !== undefined;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Owner — locked top section */}
      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Owner
        </h3>
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Avatar className="h-8 w-8 shrink-0">
            {owner.avatarUrl && (
              <AvatarImage src={owner.avatarUrl} alt={owner.displayName} />
            )}
            <AvatarFallback className="text-xs">
              {initialsFor(owner.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            {owner.username && (
              <span className="truncate font-mono text-xs text-foreground-muted">
                @{owner.username}
              </span>
            )}
            <span className="truncate text-sm text-foreground">
              {owner.displayName}
            </span>
          </div>
          <span className="text-xs text-foreground-muted">
            owner · full control
          </span>
        </div>
      </section>

      {/* Collaborators */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Collaborators ({collaborators.length})
          </h3>
          {canAddCollaborators && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add collaborator
            </Button>
          )}
        </div>

        {collaborators.length === 0 ? (
          <p className="py-2 text-sm text-foreground-muted">
            No collaborators yet. Owners can add people by username.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  {c.avatarUrl && (
                    <AvatarImage src={c.avatarUrl} alt={c.displayName} />
                  )}
                  <AvatarFallback className="text-xs">
                    {initialsFor(c.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-mono text-xs text-foreground-muted">
                    @{c.username}
                  </span>
                  <span className="truncate text-sm text-foreground">
                    {c.displayName}
                  </span>
                </div>
                {canManage ? (
                  <select
                    aria-label={`Role for ${c.displayName}`}
                    className={SELECT_CLASS}
                    value={c.role}
                    onChange={(e) =>
                      onRoleChange?.(c.id, e.target.value as CollaboratorRole)
                    }
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs capitalize text-foreground-muted">
                    {c.role}
                  </span>
                )}
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${c.displayName}`}
                    onClick={() => setPendingRemoveId(c.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canAddCollaborators && (
        <AddCollaboratorDialog
          open={adding}
          onClose={() => setAdding(false)}
          ownerUserId={ownerUserId}
          collaborators={collaborators}
          resolveUsername={resolveUsername}
          onAdd={(userId, role) => {
            onAdd?.(userId, role);
            setAdding(false);
          }}
        />
      )}

      {/* Remove confirmation */}
      <Dialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove collaborator?</DialogTitle>
            <DialogDescription>
              {pendingCollaborator
                ? `Remove @${pendingCollaborator.username} as a collaborator? They will lose access to this timeline and its events.`
                : "This collaborator will lose access to this timeline and its events."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPendingRemoveId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmRemove}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add collaborator dialog
// ---------------------------------------------------------------------------

type Resolution =
  | { status: "idle" }
  | { status: "resolving" }
  | { status: "found"; profile: ResolvedProfile }
  | { status: "not-found" }
  | { status: "owner" }
  | { status: "existing" }
  | { status: "error" };

interface AddCollaboratorDialogProps {
  open: boolean;
  onClose: () => void;
  ownerUserId: string;
  collaborators: Collaborator[];
  // Required here: the dialog is only rendered when a resolver is available, so
  // it always has a way to reach a terminal resolution state.
  resolveUsername: (username: string) => Promise<ResolvedProfile | null>;
  onAdd: (userId: string, role: CollaboratorRole) => void;
}

const RESOLVE_DEBOUNCE_MS = 300;

/**
 * Dialog shell. The form lives in a child so it unmounts when the dialog closes
 * (Radix removes closed content from the tree) — a fresh mount on each open
 * resets the form via `useState` initializers, no reset effect required.
 */
function AddCollaboratorDialog({
  open,
  onClose,
  ownerUserId,
  collaborators,
  resolveUsername,
  onAdd,
}: AddCollaboratorDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add collaborator</DialogTitle>
          <DialogDescription>
            Add someone by their username and choose what they can do.
          </DialogDescription>
        </DialogHeader>

        <AddCollaboratorForm
          ownerUserId={ownerUserId}
          collaborators={collaborators}
          resolveUsername={resolveUsername}
          onAdd={onAdd}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface AddCollaboratorFormProps {
  ownerUserId: string;
  collaborators: Collaborator[];
  resolveUsername: (username: string) => Promise<ResolvedProfile | null>;
  onAdd: (userId: string, role: CollaboratorRole) => void;
  onCancel: () => void;
}

/** Outcome of a completed resolution, keyed to the username it was run for. */
type ResolveOutcome = Exclude<Resolution, { status: "idle" | "resolving" }>;

function AddCollaboratorForm({
  ownerUserId,
  collaborators,
  resolveUsername,
  onAdd,
  onCancel,
}: AddCollaboratorFormProps) {
  const [username, setUsername] = React.useState("");
  const [role, setRole] = React.useState<CollaboratorRole>("viewer");
  // Async resolution result, tagged with the username it was computed for so a
  // stale result for an old query is ignored during render.
  const [resolved, setResolved] = React.useState<{
    username: string;
    outcome: ResolveOutcome;
  } | null>(null);

  const trimmed = username.trim().replace(/^@/, "");

  // Debounced async resolution. State is only set inside the async callback
  // (never synchronously in the effect body), and an `active` flag drops
  // out-of-order responses.
  React.useEffect(() => {
    if (trimmed.length === 0) return;
    let active = true;
    const timer = setTimeout(() => {
      void resolveUsername(trimmed)
        .then((profile) => {
          if (!active) return;
          let outcome: ResolveOutcome;
          if (profile === null) {
            outcome = { status: "not-found" };
          } else if (profile.id === ownerUserId) {
            outcome = { status: "owner" };
          } else if (collaborators.some((c) => c.id === profile.id)) {
            outcome = { status: "existing" };
          } else {
            outcome = { status: "found", profile };
          }
          setResolved({ username: trimmed, outcome });
        })
        .catch(() => {
          // Network/RLS error — land on a terminal error state so the hint and
          // disabled Add button update instead of hanging on "Looking up…".
          if (active)
            setResolved({ username: trimmed, outcome: { status: "error" } });
        });
    }, RESOLVE_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmed, resolveUsername, ownerUserId, collaborators]);

  // Derive the displayed resolution: idle when empty, the stored outcome when it
  // matches the current input, otherwise we're still resolving.
  const resolution: Resolution =
    trimmed.length === 0
      ? { status: "idle" }
      : resolved !== null && resolved.username === trimmed
        ? resolved.outcome
        : { status: "resolving" };

  const canAdd = resolution.status === "found";

  const submit = () => {
    if (resolution.status !== "found") return;
    onAdd(resolution.profile.id, role);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="add-collab-username">Username</Label>
          <Input
            id="add-collab-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="@username"
            autoComplete="off"
          />
          <ResolutionHint resolution={resolution} />
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-foreground">Role</legend>
          <RadioGroup
            value={role}
            onValueChange={(v) => setRole(v as CollaboratorRole)}
            className="gap-2"
          >
            {ROLE_OPTIONS.map((r) => (
              <label
                key={r.value}
                htmlFor={`add-collab-role-${r.value}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/30"
              >
                <RadioGroupItem
                  id={`add-collab-role-${r.value}`}
                  value={r.value}
                  className="mt-0.5"
                />
                <span className="flex flex-col">
                  <span className="text-sm text-foreground">{r.label}</span>
                  <span className="text-xs text-foreground-muted">
                    {r.description}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!canAdd} onClick={submit}>
          Add collaborator
        </Button>
      </DialogFooter>
    </>
  );
}

function ResolutionHint({ resolution }: { resolution: Resolution }) {
  switch (resolution.status) {
    case "resolving":
      return (
        <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Looking up…
        </p>
      );
    case "found":
      return (
        <p className="flex items-center gap-1.5 text-xs text-emerald-500">
          <Check className="h-3 w-3" aria-hidden />
          {resolution.profile.displayName}
        </p>
      );
    case "not-found":
      return (
        <p className="text-xs text-destructive">
          No user found with that username.
        </p>
      );
    case "owner":
      return (
        <p className="text-xs text-destructive">
          That user already owns this timeline.
        </p>
      );
    case "existing":
      return (
        <p className="text-xs text-destructive">
          Already a collaborator — close this dialog and change their role from
          the list.
        </p>
      );
    case "error":
      return (
        <p className="text-xs text-destructive">
          Couldn&rsquo;t look up that username. Check your connection and try
          again.
        </p>
      );
    case "idle":
    default:
      return null;
  }
}
