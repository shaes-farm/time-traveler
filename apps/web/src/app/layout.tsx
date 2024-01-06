import getConfig from 'next/config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, ThemeRegistry} from 'ui';

import {ui} from './ui';
import {NextConfig} from '../types';

const { 
  publicRuntimeConfig: {
    app: {
      title,
      description,
      copyright: {
        holder: name,
        url,
        year: copyrightYear
      }
    },
  },
} = getConfig() as NextConfig;

export const metadata: Metadata = {
  applicationName: title,
  authors: {
    name,
    url,
  },
  title,
  description,
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
            <Header title={title} description={description} menu={ui.header.menu} />
            {children}
            <Footer year={copyrightYear} url={url} holder={name} menu={ui.footer.menu} />
          </Container>
        </ThemeRegistry>
      </body>
    </html>
  );
}
