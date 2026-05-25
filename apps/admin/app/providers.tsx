"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

/**
 * Global QueryClient defaults:
 * - 30s staleTime for list queries (overridden per-hook as needed)
 * - Retry once on failure (avoids hammering the API on transient errors)
 * - Log errors (queries and mutations) in development; swap for a toast handler once toast infra lands
 */
function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[QueryClient] query error:", error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
      mutations: {
        onError: (error: unknown) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[QueryClient] mutation error:", error);
          }
        },
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
 * the ReactQueryDevtools panel in development.
 */
export function Providers({ children }: ProvidersProps) {
  // useState ensures the QueryClient is only created once per component
  // lifecycle, even in React Strict Mode with double-invocations.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
