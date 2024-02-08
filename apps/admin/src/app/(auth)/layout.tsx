import getConfig from 'next/config';
import type { NextConfig } from '../../types';
import { AuthLayout } from '../../layouts';

const {
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder: name,
        url,
        year,
      },
    },
  },
} = getConfig() as NextConfig;

export default function Layout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <AuthLayout name={name} url={url} year={year}>
      <main>
        {children}
      </main>
    </AuthLayout>
  );
}
