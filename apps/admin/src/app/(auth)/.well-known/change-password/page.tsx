import { redirect } from 'next/navigation'
import getConfig from 'next/config';
import type { NextConfig } from '../../../../types';
import { RECOVER_URL } from '../../constants';

const {
  publicRuntimeConfig: {
    app: {
      baseUrl: appBaseUrl,
      basePath,
    },
  },
} = getConfig() as NextConfig;

export default async function Page(): Promise<JSX.Element | null> {
  redirect(`${appBaseUrl}${basePath}${RECOVER_URL}`);
}