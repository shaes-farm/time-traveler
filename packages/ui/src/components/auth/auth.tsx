import React from 'react';
import type {FormProps} from '../form';
import {PasswordForm} from './password-form';
import {RecoverPasswordForm} from './recover-form';
import {SignUpForm} from './signup-form';

interface AuthProps extends FormProps {
  type: 'password' | 'signup' | 'recover';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  signInUrl: string;
  signIn: (formData: FormData) => Promise<void>;
  signUpUrl: string;
  signUp: (formData: FormData) => Promise<void>;
  recoverPasswordUrl: string;
  recoverPassword: (formData: FormData) => Promise<void>;
}

/**
 * Authentication component that renders a sign-in, sign-up, or password recovery form.
 * @param type - The auth form to render, one of; "password", "signup", or "recover".
 * @param icon - The icon to use in the page header (optional).
 * @param title - The title of the page (optional).
 * @param subTitle - Sub-title text of the page (optional).
 * @param signInUrl - The URL of the sign-in page.
 * @param signIn - A function used to handle sign-in requests.
 * @param signUpUrl - The URL of the sign-up page.
 * @param signUp - A function used to handle sign-up requests.
 * @param recoverPasswordUrl - The URL of the password recovery page.
 * @param recoverPassword - A function used to handle password recovery requests.
 * @returns A form component suitable for the operation requested.
 */
export function Auth({
  type,
  icon,
  title,
  subTitle, 
  signInUrl,
  signIn,
  signUpUrl,
  signUp,
  recoverPasswordUrl,
  recoverPassword,
  ...formProps
}: AuthProps): JSX.Element {
  switch (type) {
    case "password":
      return (
        <PasswordForm
          forgotPasswordUrl={recoverPasswordUrl}
          icon={icon}
          signIn={signIn}
          signUpUrl={signUpUrl}
          subTitle={subTitle}
          title={title}
          {...formProps}
        />
      );
    case "signup":
      return (
        <SignUpForm
          icon={icon}
          signInUrl={signInUrl}
          signUp={signUp}
          subTitle={subTitle}
          title={title}
          {...formProps}
        />
      );
    case "recover":
      return (
        <RecoverPasswordForm
          icon={icon}
          recoverPassword={recoverPassword}
          signInUrl={signInUrl}
          subTitle={subTitle}
          title={title}
          {...formProps}
        />
      );
  }
}
