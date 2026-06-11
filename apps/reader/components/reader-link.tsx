"use client";

import Link from "next/link";
import type { ReaderLinkProps } from "@repo/ui/components/reader-link";

/**
 * Next-specific adapter for the reader composites' framework-agnostic
 * `LinkComponent` slot. Confines `next/link` to the app layer so the
 * `@repo/ui` reader-* primitives stay framework-free (and unit-testable
 * without Next). Mirrors `apps/admin/components/shell-link.tsx`.
 */
export const ReaderLink = ({
  href,
  className,
  children,
  ...rest
}: ReaderLinkProps) => (
  <Link href={href} className={className} {...rest}>
    {children}
  </Link>
);
