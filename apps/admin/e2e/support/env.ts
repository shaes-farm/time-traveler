import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared e2e constants used by both `playwright.config.ts` and the
 * setup project. Kept in one place so the dev-server port, base URL,
 * and the saved auth state never drift between config and specs.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

export const PORT = 3000;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * Where the `setup` project writes the authenticated storage state
 * (cookies + localStorage). The authenticated project loads it so its
 * specs start already signed in. Gitignored — regenerated each run.
 */
export const STORAGE_STATE = path.resolve(here, "../.auth/user.json");

/**
 * Storage state for the seeded **admin** account, written by the `admin-setup`
 * project and loaded by `admin-authenticated`. Kept separate from
 * {@link STORAGE_STATE} so the editor session stays non-admin — that account is
 * what proves the admin gate blocks anyone. Gitignored alongside it.
 */
export const ADMIN_STORAGE_STATE = path.resolve(here, "../.auth/admin.json");
