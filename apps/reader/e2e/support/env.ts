/**
 * Shared e2e constants used by both `playwright.config.ts` and the specs.
 * Kept in one place so the dev-server port and base URL never drift from
 * the `dev` script in `apps/reader/package.json` (`next dev --port 3002`).
 *
 * Deliberately smaller than the admin equivalent (`apps/admin/e2e/support/env.ts`):
 * the reader is anonymous and read-only ([ADR-0030]), so there is no
 * `STORAGE_STATE` — nothing signs in, and no session is ever persisted.
 */

export const PORT = 3002;
export const BASE_URL = `http://localhost:${PORT}`;
