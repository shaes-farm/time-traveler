// Shared CharacterTypeBadge primitive. Promoted from apps/admin (#55 scaffold)
// to @repo/ui in #62 so the stories pages can render the perspective-character
// identity without a cross-route import.
//
// This still uses inline low-chroma Tailwind classes (not `cva` + the
// `--color-type-*` tokens) — building the fully token-driven primitive remains
// #284's job. The icon/color mapping matches
// docs/design/admin/03-aesthetic-notes.md § Character-type identity.
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
import { cn } from "@repo/ui/lib/utils";
import { characterTypeEnum } from "@repo/services/schemas/character";

export type CharacterType = (typeof characterTypeEnum.options)[number];

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

const TYPE_CLASS: Record<CharacterType, string> = {
  human: "bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20",
  animal:
    "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  mythological:
    "bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20",
  fictional:
    "bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20",
  organization: "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20",
  divine: "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
  artifact:
    "bg-yellow-700/10 text-yellow-600 ring-1 ring-inset ring-yellow-700/20",
};

export interface CharacterTypeBadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
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
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TYPE_CLASS[type],
        className,
      )}
      {...props}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? TYPE_LABEL[type]}
    </span>
  );
});
CharacterTypeBadge.displayName = "CharacterTypeBadge";
