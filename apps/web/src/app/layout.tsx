import getConfig from 'next/config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, ThemeRegistry} from 'ui';
import {ui} from './ui';

import type {PublicRuntimeConfig} from '../types';

const {publicRuntimeConfig} = getConfig();

const {app} = publicRuntimeConfig as PublicRuntimeConfig;

const {
  title,
  description,
  copyright: {
    holder: name,
    url,
  }
} = app;

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
            <Header app={app} menu={ui.header.menu} />
            {children}
            <Footer app={app} menu={ui.footer.menu} />
          </Container>
        </ThemeRegistry>
      </body>
    </html>
  );
}
