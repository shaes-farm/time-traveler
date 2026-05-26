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
 * (e.g. `emailRedirectTo`).
 *
 * Uses the env-driven `NEXT_PUBLIC_APP_URL` (e.g. `https://admin.example.com`)
 * so the origin is an allowlisted, operator-controlled value. This variable
 * MUST be set in all non-development environments; the function throws if it
 * is absent outside `development` so a misconfigured deployment is caught
 * early rather than silently sending auth emails with attacker-influenced
 * origins derived from spoofable `x-forwarded-*` request headers.
 *
 * In local development (`NODE_ENV === 'development'`) an unset `APP_URL`
 * is acceptable — spoofed headers in that context cause no meaningful harm,
 * and the fallback avoids the need to set the variable for every dev machine.
 */
const callbackUrl = async (path = "/auth/callback"): Promise<string> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}${path}`;
  }
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set in non-development environments. " +
        "Add it to your Vercel (or equivalent) environment variables.",
    );
  }
  // Development-only fallback: derive origin from request headers.
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
