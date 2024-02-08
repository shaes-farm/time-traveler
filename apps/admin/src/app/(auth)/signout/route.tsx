import getConfig from 'next/config';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import type { NextConfig } from '../../../types';

const {
  publicRuntimeConfig: {
    app: {
      baseUrl: appBaseUrl,
      basePath,
    }
  },
  serverRuntimeConfig: {
    api: {
      baseUrl: apiBaseUrl,
      key,
    }
  }
} = getConfig() as NextConfig;

export async function GET(): Promise<NextResponse> {
  const cookieStore = cookies();
  const supabase = createClient(apiBaseUrl, key, cookieStore);
  const redirectTo = new URL(basePath, appBaseUrl);

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  return NextResponse.redirect(redirectTo);
}
