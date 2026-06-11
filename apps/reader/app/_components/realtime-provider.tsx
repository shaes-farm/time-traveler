"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { createClient } from "@repo/services/supabase/client";

/**
 * Anon Supabase client for the reader's browser-side Realtime layer.
 *
 * The client is created lazily AFTER mount (dynamic import inside an effect) so
 * the module-level env-var guard in `@repo/services/supabase/client` never runs
 * during SSR/prerender — the static landing route (`/`) would otherwise fail to
 * build in an env-less CI. Reader access is anon-only; there is no service-role
 * path here ([ADR-0030] reader app placement).
 *
 * This ticket (#258) starts NO subscriptions — each data screen owns its own
 * subscription; the provider only makes the anon client available + hosts the
 * shared connection state the stale-content banner will eventually read.
 */
type ReaderSupabaseClient = ReturnType<typeof createClient>;

const ReaderSupabaseContext = createContext<ReaderSupabaseClient | null>(null);

/** The anon browser client, or `null` until it is created post-mount. */
export const useReaderSupabase = (): ReaderSupabaseClient | null =>
  use(ReaderSupabaseContext);

export function ReaderRealtimeProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ReaderSupabaseClient | null>(null);

  useEffect(() => {
    let active = true;
    void import("@repo/services/supabase/client").then(({ createClient }) => {
      if (active) setClient(createClient());
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ReaderSupabaseContext value={client}>{children}</ReaderSupabaseContext>
  );
}
