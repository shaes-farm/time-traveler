import getConfig from 'next/config';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextConfig } from '../../types';
import { AuthLayout } from '../../layouts';
import { createClient } from '../../utils/supabase/server';

const {
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder: name,
        url,
        year,
      },
    },
  },
} = getConfig() as NextConfig;

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const supabase = createClient(cookies());

  const { data: { session }, error } = await supabase.auth.getSession();

  if (!error && session) redirect('/dashboard');

  return (
    <AuthLayout name={name} url={url} year={year}>
      <main>
        {children}
      </main>
    </AuthLayout>
  );
}
