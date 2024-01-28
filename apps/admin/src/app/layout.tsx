import {Analytics} from '@vercel/analytics/react';
import getConfig from 'next/config';
import type {Metadata} from 'next'
import {ThemeRegistry} from 'ui';
import type {NextConfig} from '../types';
import {DashboardLayout} from '../layouts';

const { 
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder: name,
        url,
        year,
      },
      description,
      title,
    },
  },
} = getConfig() as NextConfig;

export const metadata: Metadata = {
  applicationName: title,
  authors: {
    name,
    url,
  },
  description,
  title,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <DashboardLayout name={name} url={url} year={year}>
            {children}
          </DashboardLayout>
        </ThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
