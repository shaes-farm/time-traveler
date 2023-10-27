import config from 'config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, ThemeRegistry} from 'ui';
import type {AppConfig} from '../types';

const app: AppConfig = config.get('app');

const {
  title,
  description,
  copyright: {
    holder: name,
    url,
  },
  ui: {
    header: {
      menu: headerMenu,
    },
    footer: {
      menu: footerMenu,
    },
  },
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
            <Header app={app} menu={headerMenu} />
            {children}
            <Footer app={app} menu={footerMenu} />
          </Container>
        </ThemeRegistry>
      </body>
    </html>
  );
}
