import { Container } from '@mui/material';
import {
  Breadcrumbs,
  Footer,
  Header,
} from '../components';
import {
  TimelineCard,
} from '../views';
import { config } from './config';
import { timeline } from './timeline';

const {
  app: {
    title,
    description,
    copyright: {
      year,
      url,
      holder,
    }
  }
} = config;

const headerMenu = [{
  label: 'home',
  route: '/',
}, {
  label: 'about',
  route: '/about',
}, {
  label: 'contact',
  route: '/contact',
}];

const footerMenu = [{
  label: 'disclaimer',
  route: '/disclaimer',
}, {
  label: 'privacy policy',
  route: '/privacy',
}, {
  label: 'terms of use',
  route: '/terms',
}];

export function Page(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Header
        description={description}
        menu={headerMenu}
        title={title}
      />
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
        <TimelineCard onSelect={(/* slug: string */) => {/* TODO */}} timeline={timeline} />
      </main>
      <Footer
        holder={holder}
        menu={footerMenu}
        url={url}
        year={year}
      />

    </Container>
  );
};
