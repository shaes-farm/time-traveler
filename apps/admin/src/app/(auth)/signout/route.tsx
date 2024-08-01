import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { getAppConfig } from '../../../utils/config';

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export async function GET(): Promise<NextResponse> {
  const supabase = createClient(cookies());
  const redirectTo = new URL(basePath, appBaseUrl);

  await supabase.auth.signOut()

  revalidatePath(redirectTo.toString(), 'layout')

  return NextResponse.redirect(redirectTo);
}
