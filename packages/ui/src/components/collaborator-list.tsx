"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Input } from "./input";

/**
 * CollaboratorList — manage a timeline's collaborators (screen 14).
 *
 * Add by `profiles.username`, change role, remove. The **owner** is
 * `timelines.user_id` (not a `timeline_collaborators` row), so it is rendered
 * as a non-removable footer line — the owner safeguard. Role/add/remove
 * controls are gated by `canManage` (owner-only); viewers get a read-only list.
 */
export type CollaboratorRole = "viewer" | "editor" | "admin";

export interface Collaborator {
  id: string;
  username: string;
  displayName: string;
  role: CollaboratorRole;
  avatarUrl?: string;
}

export interface CollaboratorListProps {
  collaborators: Collaborator[];
  ownerName: string;
  /** Owner-only gate for add/remove/role controls. Defaults to true. */
  canManage?: boolean;
  onAdd?: (username: string, role: CollaboratorRole) => void;
  onRemove?: (id: string) => void;
  onRoleChange?: (id: string, role: CollaboratorRole) => void;
  className?: string;
}

const ROLE_OPTIONS: { value: CollaboratorRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
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
  ownerName,
  canManage = true,
  onAdd,
  onRemove,
  onRoleChange,
  className,
}: CollaboratorListProps) {
  const [adding, setAdding] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [role, setRole] = React.useState<CollaboratorRole>("viewer");

  const submitAdd = () => {
    const trimmed = username.trim().replace(/^@/, "");
    if (trimmed.length === 0) return;
    onAdd?.(trimmed, role);
    setUsername("");
    setRole("viewer");
    setAdding(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {canManage && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setAdding((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add collaborator
          </Button>
        </div>
      )}

      {adding && canManage && (
        <div className="flex items-end gap-2 rounded-md border border-border bg-surface/40 px-3 py-3">
          <div className="flex-1">
            <label
              htmlFor="collab-username"
              className="mb-1 block text-xs text-foreground-muted"
            >
              Username
            </label>
            <Input
              id="collab-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAdd();
                }
              }}
              placeholder="@username"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="collab-role"
              className="mb-1 block text-xs text-foreground-muted"
            >
              Role
            </label>
            <select
              id="collab-role"
              className={SELECT_CLASS}
              value={role}
              onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" onClick={submitAdd}>
            Add
          </Button>
        </div>
      )}

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
                  onClick={() => onRemove?.(c.id)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border pt-3 text-xs text-foreground-muted">
        Owner: {ownerName} — owners can&rsquo;t be removed.
      </div>
    </div>
  );
}
