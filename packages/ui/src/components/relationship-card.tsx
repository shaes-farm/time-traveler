"use client";

import * as React from "react";
import { AlertTriangle, Link2, MoreHorizontal } from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal.js";

import { Avatar, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { TemporalDisplay } from "./temporal-display";
import { cn } from "@repo/ui/lib/utils";

export interface RelationshipCardOtherCharacter {
  name: string;
  slug: string;
  characterType: string;
  initials: string;
}

export interface RelationshipCardProps {
  otherCharacter: RelationshipCardOtherCharacter;
  /** One of the 11 relationship_type enum values. */
  relationshipType: string;
  /** Sub-role for family / professional / collaboration types only. */
  relationshipRole?: string | null;
  startTemporal?: TemporalData | null;
  endTemporal?: TemporalData | null;
  description?: string | null;
  /**
   * Narrative line for asymmetric types ("Marie is mother of Irène").
   * Rendered in italic muted text beneath the type/role badges.
   * The consumer computes this from the relationship + character context.
   */
  directionLabel?: string;
  /** Soft warning copy; surfaces as a destructive Alert inside the card. */
  contradiction?: string;
  /** This row is the reciprocal of another; subtle "Synced" badge. */
  isReciprocal?: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

const humanize = (value: string): string => value.replace(/_/g, " ");

export const RelationshipCard = React.forwardRef<
  HTMLDivElement,
  RelationshipCardProps
>(function RelationshipCard(
  {
    otherCharacter,
    relationshipType,
    relationshipRole,
    startTemporal,
    endTemporal,
    description,
    directionLabel,
    contradiction,
    isReciprocal,
    onEdit,
    onDuplicate,
    onDelete,
    className,
  },
  ref,
) {
  const hasTemporal = startTemporal != null || endTemporal != null;
  const hasActions = onEdit != null || onDuplicate != null || onDelete != null;

  return (
    <Card
      ref={ref}
      className={cn("space-y-3 p-4", className)}
      data-testid="relationship-card"
    >
      {contradiction && (
        <div
          role="alert"
          data-testid="relationship-card-contradiction"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{contradiction}</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="text-sm">
            {otherCharacter.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Top row: identity + type/role badges */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-display text-base text-foreground">
                {otherCharacter.name}
              </span>
              <Badge variant="outline" className="text-xs capitalize">
                {otherCharacter.characterType}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default" className="capitalize">
                {humanize(relationshipType)}
              </Badge>
              {relationshipRole && (
                <Badge
                  variant="secondary"
                  className="capitalize"
                  data-testid="relationship-card-role-badge"
                >
                  {humanize(relationshipRole)}
                </Badge>
              )}
              {isReciprocal && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs text-foreground-muted"
                  data-testid="relationship-card-synced-badge"
                >
                  <Link2 className="h-3 w-3" aria-hidden />
                  Synced
                </Badge>
              )}
            </div>
          </div>

          {/* Direction label (asymmetric narrative) */}
          {directionLabel && (
            <p className="text-xs italic text-foreground-muted">
              {directionLabel}
            </p>
          )}

          {/* Temporal scope */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wider text-foreground-subtle">
              Span
            </span>
            {hasTemporal ? (
              <TemporalDisplay
                value={
                  startTemporal ??
                  (endTemporal as TemporalData) /* one of them is non-null */
                }
                endValue={
                  startTemporal && endTemporal ? endTemporal : undefined
                }
                format="inline"
              />
            ) : (
              <span className="text-xs italic text-foreground-muted">
                ongoing or unknown
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="line-clamp-2 text-sm text-foreground-muted">
              {description}
            </p>
          )}
        </div>

        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                aria-label={`Actions for relationship with ${otherCharacter.name}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  Duplicate
                </DropdownMenuItem>
              )}
              {(onEdit || onDuplicate) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
});
