import React from 'react';
import type {FormProps} from '../form';
// import type {Credentials, SignUpInfo, RecoverPasswordInfo} from './_types';
import {PasswordForm} from './password-form';
import {RecoverPasswordForm} from './recover-form';
import {SignUpForm} from './signup-form';

export interface AuthProps extends FormProps {
  type: 'password' | 'signup' | 'recover';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  signInUrl: string;
  signIn: (formData: FormData) => Promise<void>;
  // signIn: (credentials: Credentials) => Promise<void>;
  signUpUrl: string;
  signUp: (formData: FormData) => Promise<void>;
  // signUp: (info: SignUpInfo) => Promise<void>;
  recoverPasswordUrl: string;
  recoverPassword: (formData: FormData) => Promise<string>;
  // recoverPassword: (info: RecoverPasswordInfo) => Promise<string>;
}

/**
 * Authentication component that renders a sign-in, sign-up, or password recovery form.
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
