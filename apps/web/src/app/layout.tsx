import config from 'config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, ThemeRegistry} from 'ui';
import type {AppConfig} from '../types';
import {ui} from './ui';

const app: AppConfig = config.get('app');

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
