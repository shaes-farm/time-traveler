"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  signIn as signInCore,
  signUp as signUpCore,
  signInWithMagicLink as signInWithMagicLinkCore,
  signOut as signOutCore,
  resetPassword as resetPasswordCore,
  updatePassword as updatePasswordCore,
  type AuthResult,
} from "../../../lib/auth";
import { getServerSupabaseClient } from "../_lib/server-supabase";

/**
 * Build the absolute callback URL the server-side Supabase APIs need
 * (e.g. `emailRedirectTo`). Reads `x-forwarded-*` headers when behind
 * a proxy, falling back to the request's `host` header.
 */
const callbackUrl = async (path = "/auth/callback"): Promise<string> => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
};

export const signInAction = async (input: {
  email: string;
  password: string;
}): Promise<AuthResult> => {
  const client = await getServerSupabaseClient();
  const result = await signInCore(client, input);
  if (result.ok) redirect("/dashboard");
  return result;
};

export const signUpAction = async (input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResult> => {
  const client = await getServerSupabaseClient();
  return signUpCore(client, {
    ...input,
    emailRedirectTo: await callbackUrl(),
  });
};

export const signInWithMagicLinkAction = async (input: {
  email: string;
}): Promise<AuthResult> => {
  const client = await getServerSupabaseClient();
  return signInWithMagicLinkCore(client, {
    email: input.email,
    emailRedirectTo: await callbackUrl(),
  });
};

export const signOutAction = async (): Promise<never> => {
  const client = await getServerSupabaseClient();
  await signOutCore(client);
  redirect("/auth/login");
};

export const resetPasswordAction = async (input: {
  email: string;
}): Promise<AuthResult> => {
  const client = await getServerSupabaseClient();
  return resetPasswordCore(client, {
    email: input.email,
    redirectTo: await callbackUrl("/auth/update-password"),
  });
};

export const updatePasswordAction = async (input: {
  password: string;
}): Promise<AuthResult> => {
  const client = await getServerSupabaseClient();
  const result = await updatePasswordCore(client, input);
  if (result.ok) redirect("/dashboard");
  return result;
};
