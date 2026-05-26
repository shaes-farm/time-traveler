import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../lib/auth";

/**
 * Build a Supabase client bound to Next 16's cookies API. The
 * `setAll` write path silently no-ops when called from a Server
 * Component (which Next disallows) — the proxy refreshes session
 * cookies on the next request, so the no-op is safe.
 */
export const getServerSupabaseClient = async (): Promise<SupabaseClient> => {
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
};
