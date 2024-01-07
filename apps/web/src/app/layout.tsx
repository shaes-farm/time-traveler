import {Analytics} from '@vercel/analytics/react';
import getConfig from 'next/config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, ThemeRegistry} from 'ui';
import type {NextConfig} from '../types';
import {ui} from './ui';

const { 
  publicRuntimeConfig: {
    app: {
      copyright: {
        holder: name,
        url,
        year: copyrightYear
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
          <Container maxWidth="lg" sx={{ m: 'auto' }}>
            <Header description={description} menu={ui.header.menu} title={title} />
            {children}
            <Footer holder={name} menu={ui.footer.menu} url={url} year={copyrightYear} />
          </Container>
        </ThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
