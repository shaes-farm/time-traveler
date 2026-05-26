import type { Meta, StoryObj } from "@storybook/react-vite";
import { AuthLayout } from "./auth-layout";
import { AuthLoginForm } from "./auth-login-form";
import { AuthRegisterForm } from "./auth-register-form";
import { AuthMagicLinkForm } from "./auth-magic-link-form";
import { AuthResetPasswordForm } from "./auth-reset-password-form";
import { AuthUpdatePasswordForm } from "./auth-update-password-form";

/**
 * Composite auth-page stories. Each mounts the AuthLayout chrome with
 * its form. Action props are mocked so stories render without Supabase.
 */

const noop = (): Promise<never> => new Promise(() => undefined);

const ERROR_MESSAGE = "Invalid email or password. Please try again.";
const MAGIC_LINK_ERROR = "Too many requests. Please wait before trying again.";
const RESET_ERROR = "Unable to send reset email. Please try again later.";
const REGISTER_ERROR = "An account with that email already exists.";

const meta: Meta = {
  title: "Pages/Auth",
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

export const Login: Story = {
  name: "Login",
  render: () => (
    <AuthLayout>
      <AuthLoginForm action={noop} />
    </AuthLayout>
  ),
};

export const LoginError: Story = {
  name: "Login — server error",
  render: () => (
    <AuthLayout>
      <AuthLoginForm action={noop} initialError={ERROR_MESSAGE} />
    </AuthLayout>
  ),
};

export const Register: Story = {
  name: "Register",
  render: () => (
    <AuthLayout>
      <AuthRegisterForm action={noop} />
    </AuthLayout>
  ),
};

export const RegisterError: Story = {
  name: "Register — server error",
  render: () => (
    <AuthLayout>
      <AuthRegisterForm action={noop} initialError={REGISTER_ERROR} />
    </AuthLayout>
  ),
};

export const RegisterSuccess: Story = {
  name: "Register — success state",
  render: () => (
    <AuthLayout>
      <AuthRegisterForm action={noop} initialSuccess />
    </AuthLayout>
  ),
};

export const MagicLink: Story = {
  name: "Magic link",
  render: () => (
    <AuthLayout>
      <AuthMagicLinkForm action={noop} />
    </AuthLayout>
  ),
};

export const MagicLinkError: Story = {
  name: "Magic link — server error",
  render: () => (
    <AuthLayout>
      <AuthMagicLinkForm action={noop} initialError={MAGIC_LINK_ERROR} />
    </AuthLayout>
  ),
};

export const MagicLinkSuccess: Story = {
  name: "Magic link — success state",
  render: () => (
    <AuthLayout>
      <AuthMagicLinkForm action={noop} initialSuccess />
    </AuthLayout>
  ),
};

export const ResetPassword: Story = {
  name: "Reset password",
  render: () => (
    <AuthLayout>
      <AuthResetPasswordForm action={noop} />
    </AuthLayout>
  ),
};

export const ResetPasswordError: Story = {
  name: "Reset password — server error",
  render: () => (
    <AuthLayout>
      <AuthResetPasswordForm action={noop} initialError={RESET_ERROR} />
    </AuthLayout>
  ),
};

export const ResetPasswordSuccess: Story = {
  name: "Reset password — success state",
  render: () => (
    <AuthLayout>
      <AuthResetPasswordForm action={noop} initialSuccess />
    </AuthLayout>
  ),
};

export const UpdatePassword: Story = {
  name: "Update password",
  render: () => (
    <AuthLayout>
      <AuthUpdatePasswordForm action={noop} />
    </AuthLayout>
  ),
};
