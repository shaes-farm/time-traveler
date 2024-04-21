'use server'
import debugLogger from 'debug';
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { logger } from '../../utils/logger';
import { getAppConfig } from '../../utils/config';
import { PASSWORD_RESET_URL, SIGNIN_URL } from './constants';

const debug = debugLogger('admin:auth:actions');

const {
  baseUrl: appBaseUrl,
  basePath,
} = getAppConfig();

export async function login(formData: FormData): Promise<void> {
  const supabase = createClient(cookies());

  // type-casting here for convenience
  // todo: validate inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    logger.error({ error });
    throw error;
  }

  revalidatePath(`${appBaseUrl}${basePath}`, 'layout');
  redirect(`${appBaseUrl}${basePath}`);
}

export async function signup(formData: FormData): Promise<void> {
  const supabase = createClient(cookies());

  // type-casting here for convenience
  // todo: validate inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${appBaseUrl}${basePath}${SIGNIN_URL}`,
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string
      }
    }
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    logger.error({ error });
    throw error;
  }

  revalidatePath(`${appBaseUrl}${basePath}`, 'layout');
  redirect(`${appBaseUrl}${basePath}`);
}

export async function recover(formData: FormData): Promise<void> {
  const supabase = createClient(cookies());

  // type-casting here for convenience
  // todo: validate inputs
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    { redirectTo: `${appBaseUrl}${basePath}${PASSWORD_RESET_URL}` }
  );

  if (error) {
    logger.error({ error });
    throw error;
  }

  revalidatePath(`${appBaseUrl}${basePath}`, 'layout');
  redirect(`${appBaseUrl}${basePath}`);
}

export async function reset(formData: FormData): Promise<void> {
  const supabase = createClient(cookies());
  
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.updateUser({
    password
  });

  debug('reset', { error, data });

  if (error) {
    logger.error({ error });
    throw error;
  }

  revalidatePath(`${appBaseUrl}${basePath}`, 'layout');
  redirect(`${appBaseUrl}${basePath}`);
}
