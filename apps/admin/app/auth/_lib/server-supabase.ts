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
      } catch {
        // Server Components can't mutate cookies; proxy.ts handles refresh.
      }
    },
  });
};
