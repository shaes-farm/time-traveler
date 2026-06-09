import type { ComponentType, ReactNode } from "react";

/**
 * Framework-agnostic link contract for the **public reader** chrome.
 *
 * Deliberately separate from the admin `ShellLinkProps` (shell.tsx): the
 * reader never shares the admin navigation shell ([ADR-0030]/[ADR-0031]),
 * so its composites carry their own link slot. The reader app supplies a
 * `next/link` adapter; Storybook/tests supply a plain `<a>`.
 */
export interface ReaderLinkProps {
  href: string;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
}

export type ReaderLinkComponent = ComponentType<ReaderLinkProps>;

/** Plain-anchor fallback so the composites render without a framework adapter. */
export const DefaultReaderLink = ({
  href,
  className,
  children,
  ...rest
}: ReaderLinkProps) => (
  <a href={href} className={className} {...rest}>
    {children}
  </a>
);
