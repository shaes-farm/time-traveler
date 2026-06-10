"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster, toast } from "@repo/ui/components/sonner";
import { TimelinePublishError } from "@repo/services/timeline-service";

/**
 * Maps a mutation error to a user-facing message. Centralized here so every
 * failed mutation surfaces a single, consistent toast (no per-call-site
 * duplication). Specific publish-workflow failures get tailored copy:
 *  - timeline publish with no linked events (#212 guard, TimelinePublishError)
 *  - event publish by a non-owner (#48 DB trigger — assertNoError wraps the
 *    Postgres message rather than its 42501 code, so we match on the text)
 */
function mutationErrorMessage(error: unknown): string {
  if (error instanceof TimelinePublishError && error.code === "no_events") {
    return "Add at least one linked event before publishing this timeline.";
  }
  if (error instanceof Error && /publication state/i.test(error.message)) {
    return "Only the owner can change publication state.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Global QueryClient defaults:
 * - 30s staleTime for list queries (overridden per-hook as needed)
 * - Retry once on failure (avoids hammering the API on transient errors)
 * - Query errors log in development (lists render their own inline error +
 *   Retry, so they are not toasted); mutation errors toast a friendly message.
 */
function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // Lists render their own inline error + Retry, so a failed/aborted
        // query (e.g. a refetch cancelled during navigation) isn't fatal. Use
        // console.warn, not console.error: Next 16's dev devtools intercept
        // console.error and escalate it to the red error overlay.
        if (process.env.NODE_ENV === "development") {
          console.warn("[QueryClient] query error:", error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(mutationErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root client providers for the admin app.
 * Wraps the app tree in a QueryClientProvider with a stable QueryClient
 * instance (created once per component mount, not on every render), plus
 * the Sonner toaster and the ReactQueryDevtools panel in development.
 */
export function Providers({ children }: ProvidersProps) {
  // useState ensures the QueryClient is only created once per component
  // lifecycle, even in React Strict Mode with double-invocations.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
