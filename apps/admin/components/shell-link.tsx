"use client";

import Link from "next/link";
import type { ShellLinkProps } from "@repo/ui/components/shell";

/**
 * Next-specific adapter for the Shell's framework-agnostic
 * `LinkComponent` slot. Confines `next/link` to the app layer per
 * Batch C's design-for-extraction note in
 * docs/design/admin/fidelity-2-plan.md.
 */
export const ShellLink = ({
  href,
  className,
  children,
  ...rest
}: ShellLinkProps) => (
  <Link href={href} className={className} {...rest}>
    {children}
  </Link>
);
