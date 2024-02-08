import getConfig from 'next/config';
import { Auth } from 'ui';
import type { NextConfig } from '../../../types';
import { RECOVER_URL, SIGNIN_URL, SIGNUP_URL } from '../routes';
import { login, signup, recover } from '../actions';

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
      recoverPassword={recover}
      recoverPasswordUrl={RECOVER_URL}
      signIn={login}
      signInUrl={SIGNIN_URL}
      signUp={signup}
      signUpUrl={SIGNUP_URL}
      subTitle={`Welcome to ${title}`}
      title="Recover Password"
      type="recover"
    />
  );
}
