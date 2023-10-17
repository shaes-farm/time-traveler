import config from 'config';
import type { Metadata } from 'next'
import {ThemeRegistry} from './theme-registry';

const {
  title,
  description,
  copyright: {
    holder,
    url,
  },
}: {
  title: string;
  description: string;
  copyright: {
    holder: string;
    url: string;
  };
} = config.get('app');

export const metadata: Metadata = {
  applicationName: title,
  authors: {
    name: holder,
    url,
  },
  title,
  description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui' }}>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  )
}
