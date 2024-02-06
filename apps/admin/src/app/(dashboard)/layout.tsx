import getConfig from 'next/config';
import type { NextConfig } from '../../types';
import { DashboardLayout } from '../../layouts';

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
    <DashboardLayout name={name} url={url} year={year}>
      {children}
    </DashboardLayout>
  );
}
