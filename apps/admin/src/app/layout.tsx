import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { ThemeRegistry } from 'ui';
import { getAppConfig } from '../utils/config';

const {
  copyright: {
    holder: name,
    url,
  },
  description,
  title,
} = getAppConfig();

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
