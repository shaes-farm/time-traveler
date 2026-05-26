import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Auth verbs. Plain async functions that accept a Supabase client —
 * Server Action wrappers in `app/auth/_actions/` supply the
 * server-bound client; client form components (later) can call these
 * with the browser client.
 *
 * Each function returns a discriminated `AuthResult` so callers can
 * branch on `ok` without try/catch noise. Error shapes mirror Supabase
 * — `code` is the gotrue error code, `message` is the human string.
 */

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code?: string; message: string } };

export interface SignUpInput {
  email: string;
  password: string;
  /** First + last go into `raw_user_meta_data` so `handle_new_user` can populate profiles. */
  firstName: string;
  lastName: string;
  /** Used by Supabase to build the email confirmation link target. */
  emailRedirectTo: string;
}

export const signUp = async (
  client: SupabaseClient,
  input: SignUpInput,
): Promise<AuthResult> => {
  const { error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
      },
    },
  });
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};

export interface SignInInput {
  email: string;
  password: string;
}

export const signIn = async (
  client: SupabaseClient,
  input: SignInInput,
): Promise<AuthResult> => {
  const { error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};

export interface SignInWithMagicLinkInput {
  email: string;
  /** Target the callback handler will redirect into after exchanging the code. */
  emailRedirectTo: string;
}

export const signInWithMagicLink = async (
  client: SupabaseClient,
  input: SignInWithMagicLinkInput,
): Promise<AuthResult> => {
  const { error } = await client.auth.signInWithOtp({
    email: input.email,
    options: { emailRedirectTo: input.emailRedirectTo },
  });
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};

export const signOut = async (client: SupabaseClient): Promise<AuthResult> => {
  const { error } = await client.auth.signOut();
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};

export interface ResetPasswordInput {
  email: string;
  redirectTo: string;
}

export const resetPassword = async (
  client: SupabaseClient,
  input: ResetPasswordInput,
): Promise<AuthResult> => {
  const { error } = await client.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};

export interface UpdatePasswordInput {
  password: string;
}

export const updatePassword = async (
  client: SupabaseClient,
  input: UpdatePasswordInput,
): Promise<AuthResult> => {
  const { error } = await client.auth.updateUser({
    password: input.password,
  });
  if (error)
    return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: true, data: undefined };
};
