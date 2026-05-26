export { getBrowserSupabaseClient } from "./browser-client";
export {
  createServerSupabaseClient,
  type CookieAdapter,
  type CookieOptions,
} from "./server-client";
export {
  signUp,
  signIn,
  signInWithMagicLink,
  signOut,
  resetPassword,
  updatePassword,
  type AuthResult,
  type SignUpInput,
  type SignInInput,
  type SignInWithMagicLinkInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from "./methods";
export { getSession, getUser, getProfile, type AuthProfile } from "./session";
export {
  signInSchema,
  signUpSchema,
  magicLinkSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type SignInValues,
  type SignUpValues,
  type MagicLinkValues,
  type ResetPasswordValues,
  type UpdatePasswordValues,
} from "./schemas";
