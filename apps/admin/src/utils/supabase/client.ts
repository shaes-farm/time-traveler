import { createBrowserClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- object
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
