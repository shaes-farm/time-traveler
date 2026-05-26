import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "./lib/auth";

/**
 * Next.js 16 edge proxy (replaces `middleware.ts` from Next ≤15).
 *
 * ## How Next.js discovers this file
 * Next 16 looks for `proxy.ts` (or `proxy.js`) at the root of the app
 * directory — the same auto-discovery convention that previously applied
 * to `middleware.ts`. No entry in `next.config.js` is required.
 * The required exports are:
 *   - `proxy` — async function `(request: NextRequest) => NextResponse`
 *     (analogous to the default export in the old middleware API).
 *   - `config.matcher` — path patterns this file runs against.
 * Both are present at the bottom of this file.
 *
 * ## Responsibilities
 *  1. Refresh the Supabase session cookie on every request (the SDK
 *     rotates JWTs; without a refresh the user is silently logged out
 *     when the access token expires).
 *  2. Gate `(protected)` and `(admin)` route groups — Next route
 *     groups don't appear in URLs, so this file owns the URL-pattern
 *     → gate mapping.
 *  3. Redirect already-authenticated users away from auth pages.
 *
 * Closes #36. Note: #36's text says `is_admin = true`; the schema in
 * `00001_initial_schema.sql` uses `profiles.role = 'admin'`. This
 * proxy follows the schema.
 */

const AUTH_PREFIX = "/auth";
const ADMIN_PREFIX = "/admin";

/**
 * Public URLs (no auth required). Auth pages live here so the redirect
 * rule below ("already signed in → /dashboard") can run before the gate.
 * Public timeline detail (`/timelines/<slug>`) is handled by the regex
 * below since it shares the `/timelines` prefix with a protected list.
 */
const PUBLIC_TIMELINE_DETAIL = /^\/timelines\/[^/]+\/?$/;

const isAuthRoute = (path: string) =>
  path === AUTH_PREFIX || path.startsWith(`${AUTH_PREFIX}/`);

const isPublicRoute = (path: string) => {
  // Normalise trailing slash so /timelines/new/ can't bypass the explicit
  // deny below by slipping through the PUBLIC_TIMELINE_DETAIL regex.
  const p = path.length > 1 ? path.replace(/\/$/, "") : path;
  if (isAuthRoute(p)) return true;
  if (p === "/timelines") return false; // protected list
  if (p === "/timelines/new") return false; // protected new-page stub
  return PUBLIC_TIMELINE_DETAIL.test(p);
};

const isAdminRoute = (path: string) =>
  path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const { pathname, origin, search } = request.nextUrl;
  let response = NextResponse.next({ request });

  const client = createServerSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll: (toSet) => {
      // Re-create response so refreshed cookies attach to the outgoing one.
      response = NextResponse.next({ request });
      for (const { name, value, options } of toSet) {
        response.cookies.set({ name, value, ...(options ?? {}) });
      }
    },
  });

  // getUser() validates the JWT against gotrue and refreshes the
  // session cookie if it's near expiry. Cheaper than session() because
  // we already have the cookie; the extra roundtrip is the cost of
  // protecting against forged-cookie bypasses.
  const {
    data: { user },
  } = await client.auth.getUser();

  // Auth pages: redirect signed-in users away.
  if (isAuthRoute(pathname)) {
    if (user && pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
    return response;
  }

  // Public routes: pass through (session still refreshed above).
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Protected + admin routes both require a session.
  if (!user) {
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes additionally require role='admin'.
  if (isAdminRoute(pathname)) {
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard?error=forbidden", origin),
      );
    }
  }

  return response;
};

/**
 * Skip static assets, image optimisation, favicon, and route-handler
 * paths that don't need session refresh. The auth callback is included
 * — it sets cookies the proxy must let through untouched.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
