import { cache } from "react";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient, getUser } from "../../../lib/auth";

/**
 * Build a Supabase client bound to Next 16's cookies API. The
 * `setAll` write path silently no-ops when called from a Server
 * Component (which Next disallows) — the proxy refreshes session
 * cookies on the next request, so the no-op is safe.
 *
 * Wrapped in React `cache()` so repeated calls within a single request (a
 * layout and its nested pages both need a client) reuse one instance / cookie
 * read. `cache` is request-scoped, so Server Actions and Route Handlers — a
 * single call each — are unaffected.
 */
export const getServerSupabaseClient = cache(
  async (): Promise<SupabaseClient> => {
    const store = await cookies();
    return createServerSupabaseClient({
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            store.set({ name, value, ...(options ?? {}) });
          }
        } catch (err) {
          // Next.js throws synchronously when cookies are mutated from a
          // Server Component. That's expected — the proxy refreshes the
          // session on the next request. Re-throw anything else so real
          // failures (e.g. in Server Actions or Route Handlers) surface.
          const message = err instanceof Error ? err.message : String(err);
          if (!message.includes("Cookies can only be modified")) {
            throw err;
          }
        }
      },
    });
  },
);

/**
 * The authenticated user for the current request, resolved once and memoized
 * with React `cache()`. A layout and its nested pages each need the user, and
 * the layout must render before its children — without this they'd each fire a
 * separate GoTrue round-trip (`getUser` validates the JWT), a server waterfall.
 * Returns `null` when unauthenticated; callers redirect.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  return getUser(await getServerSupabaseClient());
});
