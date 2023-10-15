import {Container} from '@mui/material';
import {
  Breadcrumbs,
  Footer,
  Header,
} from '../components';
import {
  TimelineCard,
} from '../views';
import {config} from './config';
import {timeline} from './timeline';

const headerMenu = [{
  label: 'home',
  route: '/',
},{
  label: 'about',
  route: '/about',
},{
  label: 'contact',
  route: '/contact',
}];

const footerMenu = [{
  label: 'disclaimer',
  route: '/disclaimer',
},{
  label: 'privacy policy',
  route: '/privacy',
},{
  label: 'terms of use',
  route: '/terms',
}];

export function Page(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Header app={config.app} menu={headerMenu} />
      <Breadcrumbs crumbs={[
        {
          link: config.app.baseUrl,
          label: config.app.title,
        },
        {
          link: `${config.app.baseUrl}/timelines`,
          label: 'timelines',
        },
        {
          label: timeline.title,
        },
      ]} />
      <main>
        <TimelineCard timeline={timeline} />
      </main>
      <Footer app={config.app} menu={footerMenu} />
    </Container>
  );
};
