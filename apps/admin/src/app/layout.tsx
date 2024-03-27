import {Analytics} from '@vercel/analytics/react';
import getConfig from 'next/config';
import type {Metadata} from 'next';
import {ThemeRegistry} from 'ui';
import type {NextConfig} from '../types';

const { 
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder: name,
        url,
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
          {children}
        </ThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
