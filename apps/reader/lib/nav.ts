import { Search } from "lucide-react";
import type { ReaderNavItem } from "@repo/ui/components/reader-nav";
import type { ReaderFooterLink } from "@repo/ui/components/reader-footer";

/**
 * Reader chrome navigation model.
 *
 * Three top-level destinations only — Explore / Stories / Search — per
 * docs/design/public/06-mid-fidelity/00-app-shell.md annotation 2. Entity
 * types (periods/characters/events) are reached via contextual cross-links,
 * never the global nav. Search is present but stubbed at launch.
 */
export const READER_NAV_ITEMS: ReaderNavItem[] = [
  { label: "Explore", href: "/explore" },
  { label: "Stories", href: "/stories" },
  { label: "Search", href: "/search", icon: Search },
];

/** Brand tagline (landing hi-fi / manifesto) shown in the footer. */
export const TAGLINE =
  "Everything has a history, and every history deserves to be explored.";

/**
 * Base URL of the admin/auth surface the reader deep-links OUT to. The reader
 * is anonymous and gates nothing (00-app-shell annotation 3); this only builds
 * the Sign-in href. Set `NEXT_PUBLIC_ADMIN_URL` in staging/production; local
 * dev falls back to the admin dev server on :3000.
 */
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3000";

export const SIGN_IN_HREF = `${ADMIN_URL}/auth/login`;
export const REGISTER_HREF = `${ADMIN_URL}/auth/register`;

export const FOOTER_LINKS: ReaderFooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Sign in", href: SIGN_IN_HREF, external: true },
  { label: "Legal", href: "/legal" },
];
