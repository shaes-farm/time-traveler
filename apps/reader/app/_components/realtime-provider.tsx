"use client";

import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { createClient } from "@repo/services/supabase/client";

/**
 * Anon Supabase client + shared Realtime connection state for the reader.
 *
 * The client is created lazily AFTER mount (dynamic import inside an effect) so
 * the module-level env-var guard in `@repo/services/supabase/client` never runs
 * during SSR/prerender — the static landing route (`/`) would otherwise fail to
 * build in an env-less CI. Reader access is anon-only; there is no service-role
 * path here ([ADR-0030] reader app placement).
 *
 * #258 shipped the client wiring only (no subscriptions). This provider now also
 * owns the **shared connection state** that the stale-content banner reads: a
 * lightweight heartbeat channel tracks whether the Realtime socket is live, so
 * every data screen gets connection-loss handling for free and the shell can
 * surface a single banner. Individual screens still own their own
 * `postgres_changes` subscriptions for content; this channel only watches
 * liveness.
 */
type ReaderSupabaseClient = ReturnType<typeof createClient>;

/**
 * Connection liveness as the banner sees it. `connected` hides the banner;
 * `stale` shows the "live updates paused" notice + Refresh; `reconnecting`
 * shows the transient reconnecting notice while a resubscribe is in flight.
 */
export type ReaderConnectionState = "connected" | "stale" | "reconnecting";

const ReaderSupabaseContext = createContext<ReaderSupabaseClient | null>(null);
// Optimistic default: assume connected until the heartbeat says otherwise, so a
// healthy session never flashes the banner.
const ReaderConnectionContext =
  createContext<ReaderConnectionState>("connected");

/** The anon browser client, or `null` until it is created post-mount. */
export const useReaderSupabase = (): ReaderSupabaseClient | null =>
  use(ReaderSupabaseContext);

/** Shared Realtime connection state for the stale-content banner. */
export const useReaderConnection = (): ReaderConnectionState =>
  use(ReaderConnectionContext);

// Delay before a dropped channel attempts to resubscribe. Long enough to avoid
// hammering a flapping connection, short enough that recovery feels prompt.
const RESUBSCRIBE_DELAY_MS = 3_000;

export function ReaderRealtimeProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ReaderSupabaseClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<ReaderConnectionState>("connected");

  useEffect(() => {
    let active = true;
    void import("@repo/services/supabase/client").then(({ createClient }) => {
      if (active) setClient(createClient());
    });
    return () => {
      active = false;
    };
  }, []);

  // Heartbeat channel: map Realtime subscribe statuses onto the banner's state
  // machine and auto-resubscribe after a dropped connection.
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (client === null) return;

    let active = true;
    const channel = client.channel("reader:heartbeat");

    const clearRetry = () => {
      if (retryRef.current !== null) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };

    const subscribe = () => {
      channel.subscribe((status) => {
        if (!active) return;
        switch (status) {
          case "SUBSCRIBED":
            clearRetry();
            setConnectionState("connected");
            break;
          case "CHANNEL_ERROR":
          case "TIMED_OUT":
          case "CLOSED":
            setConnectionState("stale");
            // Schedule a single resubscribe attempt; surface "reconnecting"
            // while it is in flight so the banner reflects the recovery.
            clearRetry();
            retryRef.current = setTimeout(() => {
              if (!active) return;
              setConnectionState("reconnecting");
              subscribe();
            }, RESUBSCRIBE_DELAY_MS);
            break;
          default:
            break;
        }
      });
    };

    subscribe();

    return () => {
      active = false;
      clearRetry();
      void client.removeChannel(channel);
    };
  }, [client]);

  return (
    <ReaderSupabaseContext value={client}>
      <ReaderConnectionContext value={connectionState}>
        {children}
      </ReaderConnectionContext>
    </ReaderSupabaseContext>
  );
}
