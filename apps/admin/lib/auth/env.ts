/**
 * Auth env var access. Centralised here so the Next-agnostic core can
 * import config without referencing `process.env` directly — easier to
 * stub in tests and easier to swap when this module lifts to
 * `packages/auth` for the future reader app.
 *
 * NEXT_PUBLIC_* variables must be accessed via static string literals so
 * Next.js can inline them at build time. A dynamic key (process.env[name])
 * is not replaced by the bundler and evaluates to `undefined` in the
 * client bundle even when the variable is present in the environment.
 */

const missingVarError = (name: string): never => {
  throw new Error(
    `Missing env var ${name}. Copy .env.local.example to apps/admin/.env.local and fill it in.`,
  );
};

export const getSupabaseUrl = (): string =>
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  missingVarError("NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseAnonKey = (): string =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  missingVarError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
