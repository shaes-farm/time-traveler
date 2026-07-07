"use client";

import * as React from "react";
import {
  Anchor,
  Atom,
  Bird,
  BookOpen,
  Brain,
  Bug,
  Building2,
  Castle,
  Church,
  Cog,
  Coins,
  Compass,
  Crown,
  Dna,
  Feather,
  FlaskConical,
  Flame,
  Gavel,
  Gem,
  Globe,
  Hammer,
  Heart,
  Landmark,
  Leaf,
  MapPin,
  Microscope,
  Mountain,
  Music,
  Palette,
  Rocket,
  Scroll,
  Ship,
  Shield,
  Skull,
  Sparkles,
  Star,
  Swords,
  Tag,
  Telescope,
  TreePine,
  Trophy,
  Users,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

/**
 * Curated lucide subset offered by the category icon picker. Keys are the
 * canonical kebab-case lucide names (lucide.dev) and are what gets persisted in
 * `categories.icon`. Chosen to cover common taxonomy domains (science, war,
 * art, nature, myth, religion, tech…) without shipping the whole icon set.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  atom: Atom,
  landmark: Landmark,
  swords: Swords,
  palette: Palette,
  "flask-conical": FlaskConical,
  globe: Globe,
  "book-open": BookOpen,
  users: Users,
  crown: Crown,
  sparkles: Sparkles,
  rocket: Rocket,
  microscope: Microscope,
  music: Music,
  scroll: Scroll,
  "building-2": Building2,
  church: Church,
  skull: Skull,
  leaf: Leaf,
  mountain: Mountain,
  ship: Ship,
  cog: Cog,
  coins: Coins,
  gavel: Gavel,
  heart: Heart,
  flame: Flame,
  star: Star,
  "map-pin": MapPin,
  zap: Zap,
  brain: Brain,
  dna: Dna,
  telescope: Telescope,
  feather: Feather,
  hammer: Hammer,
  shield: Shield,
  trophy: Trophy,
  wheat: Wheat,
  "tree-pine": TreePine,
  bird: Bird,
  bug: Bug,
  gem: Gem,
  anchor: Anchor,
  compass: Compass,
  castle: Castle,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

/** The neutral fallback icon for categories with no chosen icon. */
export const DefaultCategoryIcon = Tag;

/**
 * Render a category's icon. Resolution order (wireframe 24 #3):
 * 1. a curated lucide name → that icon;
 * 2. any other non-empty string → rendered verbatim as text (covers emoji and
 *    free-text identifiers);
 * 3. empty/undefined → the neutral {@link DefaultCategoryIcon} (`Tag`).
 */
export function CategoryIcon({
  name,
  className = "h-3.5 w-3.5",
}: {
  name?: string | null;
  className?: string;
}) {
  const trimmed = name?.trim() ?? "";
  if (trimmed === "") {
    return <DefaultCategoryIcon className={className} aria-hidden />;
  }
  const Icon = CATEGORY_ICONS[trimmed];
  if (Icon) {
    return <Icon className={className} aria-hidden />;
  }
  // Emoji / unknown identifier: render the raw glyph in the icon's sizing box so
  // tree rows stay aligned. `leading-none` keeps a single emoji centered.
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center leading-none",
        className,
      )}
      aria-hidden
    >
      {trimmed}
    </span>
  );
}
