import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose Tailwind class names with conflict resolution.
 *
 * `clsx` flattens conditionals and arrays; `twMerge` resolves
 * Tailwind-utility conflicts (later classes win). Used by every
 * design-system primitive that accepts a `className` prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
