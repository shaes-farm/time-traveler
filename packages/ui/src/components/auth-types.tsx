/**
 * Result type for auth form → server action contracts.
 *
 * Intentionally looser than `AuthResult` in `apps/admin/lib/auth/methods`:
 * `data` is optional here because most auth actions either redirect on
 * success (login, update-password) or return no payload (magic-link,
 * reset-password, register). Do not assume this type is interchangeable
 * with `AuthResult` — the shapes differ on the `ok: true` branch.
 */
export type AuthActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: { code?: string; message: string } };
