/**
 * Shared types for auth form components. Mirrors the shape of
 * AuthResult from apps/admin/lib/auth/methods without creating a
 * cross-package dependency.
 */
export type AuthActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: { code?: string; message: string } };
