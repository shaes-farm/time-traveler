import getConfig from 'next/config';
import { Auth } from 'ui';
import type { NextConfig } from '../../../types';
import { RECOVER_URL, SIGNIN_URL, SIGNUP_URL } from '../routes';

const { 
  publicRuntimeConfig: {
    app: {
      title,
    },
  },
} = getConfig() as NextConfig;

export default function Page(): JSX.Element {
  return (
    <Auth
      recoverPasswordUrl={RECOVER_URL}
      signInUrl={SIGNIN_URL}
      signUpUrl={SIGNUP_URL}
      subTitle={`Welcome to ${title}`}
      title="Sign Up"
      type="signup"
    />
  );
}
