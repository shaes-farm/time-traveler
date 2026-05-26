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

  // Guard against open-redirect: require a same-origin relative path.
  // A value that starts with exactly one "/" cannot carry a scheme and
  // will always resolve relative to url.origin via `new URL(next, base)`.
  // "//…" (protocol-relative) is the only single-slash form that escapes
  // origin, so we reject it explicitly. No regex needed — and avoiding
  // one removes the ReDoS surface flagged by CodeQL.
  const isSafeRelativePath = (s: string) =>
    s.startsWith("/") && !s.startsWith("//");
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
