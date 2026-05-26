/**
 * Auth env var access. Centralised here so the Next-agnostic core can
 * import config without referencing `process.env` directly — easier to
 * stub in tests and easier to swap when this module lifts to
 * `packages/auth` for the future reader app.
 */

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Copy .env.local.example to apps/admin/.env.local and fill it in.`,
    );
  }
  return value;
};

export const getSupabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL");
export const getSupabaseAnonKey = () =>
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
