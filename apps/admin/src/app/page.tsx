import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../utils/supabase/server'

export default async function Page(): Promise<JSX.Element | null> {
  const supabase = createClient(cookies());

  const { data, error } = await supabase.auth.getUser();

  const {log} = console;
  log({data});

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- test data
  if (error || !data?.user) {
    redirect('/signin')
  }

  redirect('/dashboard');
 
  return null;
}