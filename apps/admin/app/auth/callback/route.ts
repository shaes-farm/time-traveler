import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "../_lib/server-supabase";

/**
 * OAuth / magic-link / email-confirmation callback. Supabase redirects
 * here with a `code` query param; we exchange it for a session and
 * forward to the post-auth target (`?next=`, defaulting to the
 * dashboard for sign-ups and `/auth/update-password` for resets).
 */
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

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
