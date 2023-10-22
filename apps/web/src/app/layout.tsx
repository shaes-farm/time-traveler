import config from 'config';
import type { Metadata } from 'next'
import {Container} from '@mui/material';
import {Footer, Header, type LabeledRoute} from 'ui';
import {ThemeRegistry} from './theme-registry';

interface AppConfig {
  title: string;
  description: string;
  copyright: {
    holder: string;
    url: string;
    year: number;
  };
};

const app: AppConfig = config.get('app');

const headerMenu: LabeledRoute[] = [{
  label: 'home',
  route: '/',
},{
  label: 'about',
  route: '/about',
},{
  label: 'contact',
  route: '/contact',
}];

const footerMenu: LabeledRoute[] = [{
  label: 'credits',
  route: '/credits',
},{
  label: 'terms',
  route: '/terms',
},{
  label: 'privacy',
  route: '/privacy',
}];

const {
  title,
  description,
  copyright: {
    holder: name,
    url,
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
