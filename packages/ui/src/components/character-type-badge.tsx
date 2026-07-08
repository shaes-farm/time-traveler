// Shared CharacterTypeBadge primitive. Promoted from apps/admin (#55 scaffold)
// to @repo/ui in #62 so the stories pages can render the perspective-character
// identity without a cross-route import.
//
// Token-driven `cva` primitive (#284): each of the 7 `character_type` values
// gets a low-chroma `--color-type-*` tint (source of truth in styles/tokens.ts,
// mirrored in styles/tokens.css) + a lucide icon + an always-visible literal label.
// The icon/color mapping matches docs/design/admin/03-aesthetic-notes.md § Character-type identity.
import * as React from "react";
import {
  User,
  PawPrint,
  Drama,
  BookOpen,
  Building2,
  Sparkles,
  Gem,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";
import { characterTypeEnum } from "@repo/services/schemas/character";

export type CharacterType = (typeof characterTypeEnum.options)[number];

const characterTypeBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      type: {
        human:
          "bg-type-human/10 text-type-human ring-1 ring-inset ring-type-human/20",
        animal:
          "bg-type-animal/10 text-type-animal ring-1 ring-inset ring-type-animal/20",
        mythological:
          "bg-type-mythological/10 text-type-mythological ring-1 ring-inset ring-type-mythological/20",
        fictional:
          "bg-type-fictional/10 text-type-fictional ring-1 ring-inset ring-type-fictional/20",
        organization:
          "bg-type-organization/10 text-type-organization ring-1 ring-inset ring-type-organization/20",
        divine:
          "bg-type-divine/10 text-type-divine ring-1 ring-inset ring-type-divine/20",
        artifact:
          "bg-type-artifact/10 text-type-artifact ring-1 ring-inset ring-type-artifact/20",
      },
    },
  },
);

/** Exported for reuse as the type-icon placeholder in list name-cell hover
 * thumbnails (no media → show the type icon instead). */
export const CHARACTER_TYPE_ICON: Record<
  CharacterType,
  React.ComponentType<{ className?: string }>
> = {
  human: User,
  animal: PawPrint,
  mythological: Drama,
  fictional: BookOpen,
  organization: Building2,
  divine: Sparkles,
  artifact: Gem,
};

const TYPE_LABEL: Record<CharacterType, string> = {
  human: "Human",
  animal: "Animal",
  mythological: "Mythological",
  fictional: "Fictional",
  organization: "Organization",
  divine: "Divine",
  artifact: "Artifact",
};

export interface CharacterTypeBadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof characterTypeBadgeVariants> {
  /** The character_type value this badge represents (required). */
  type: CharacterType;
  /** Optional label override; defaults to the canonical name for the type. */
  label?: string;
}

/**
 * Icon + low-chroma tint + always-visible label for the 7 `character_type`
 * values. The label always carries the accessible name — the icon is
 * `aria-hidden` and never stands alone (03-aesthetic-notes.md § Character-type
 * identity, finalized).
 */
export const CharacterTypeBadge = React.forwardRef<
  HTMLSpanElement,
  CharacterTypeBadgeProps
>(({ className, type, label, ...props }, ref) => {
  const Icon = CHARACTER_TYPE_ICON[type];
  return (
    <span
      ref={ref}
      className={cn(characterTypeBadgeVariants({ type, className }))}
      {...props}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? TYPE_LABEL[type]}
    </span>
  );
});
CharacterTypeBadge.displayName = "CharacterTypeBadge";

export { characterTypeBadgeVariants };
