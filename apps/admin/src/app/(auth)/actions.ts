'use server'

import { revalidatePath } from 'next/cache'
import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/actions'
import type { NextConfig } from '../../types';

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

export async function login(formData: FormData): Promise<void> {
  const cookieStore = cookies()
  const supabase = createClient(apiBaseUrl, key, cookieStore)

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData): Promise<void> {
  const cookieStore = cookies()
  const supabase = createClient(apiBaseUrl, key, cookieStore)

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${appBaseUrl}${basePath}/signin`,
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function recover(formData: FormData): Promise<void> {
    const cookieStore = cookies()
    const supabase = createClient(apiBaseUrl, key, cookieStore)
  
    // type-casting here for convenience
    // in practice, you should validate your inputs
    const email = formData.get('email') as string;
  
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${appBaseUrl}${basePath}` }
    );
  
    if (error) {
      redirect('/error')
    }
  
    revalidatePath('/', 'layout')
    redirect('/')
  }