import {Container} from '@mui/material';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {Breadcrumbs} from '../components/breadcrumbs';
import {TimelineCard} from '../cards/timeline-card';
import {config} from './config';
import {timeline} from './timeline';

export function Page(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Header app={config.app}/>
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
      <Footer app={config.app}/>
    </Container>
  );
};
