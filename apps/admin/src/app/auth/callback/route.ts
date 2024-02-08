import getConfig from 'next/config';
import { type EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const {
  serverRuntimeConfig: {
    api: {
      baseUrl,
      key,
    }
  }
} = getConfig() as NextConfig;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = cookies();

  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');

  if (tokenHash && type) {
    const supabase = createClient(baseUrl, key, cookieStore);

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      redirectTo.searchParams.delete('next');
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error';

  return NextResponse.redirect(redirectTo);
}