import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "../_lib/server-supabase";

/**
 * OAuth / magic-link / email-confirmation callback. Supabase redirects
 * here with a `code` query param; we exchange it for a session and
 * forward to the post-auth target (`?next=`, defaulting to `/dashboard`).
 * The reset-password flow passes `redirectTo: /auth/update-password`
 * directly to Supabase so it is already baked into the email link before
 * this callback is invoked — the `?next=` param is not used for that flow.
 */
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/dashboard";

  // Guard against open-redirect: only allow same-origin relative paths.
  // Must start with "/" but not "//" (protocol-relative URL) and must
  // contain no scheme characters. Fall back to /dashboard if invalid.
  const isSafeRelativePath = (s: string) =>
    s.startsWith("/") && !s.startsWith("//") && !/[a-z][a-z0-9+\-.]*:/i.test(s);
  const next = isSafeRelativePath(rawNext) ? rawNext : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=missing_code`, url.origin),
    );
  }

  const client = await getServerSupabaseClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.code ?? "exchange_failed")}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
};
