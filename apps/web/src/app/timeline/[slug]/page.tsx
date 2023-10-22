import config from 'config';
import {notFound} from 'next/navigation'
import {Container} from '@mui/material';
import {TimelineNavigator} from 'ui';
import {Fetch} from 'service';

const f = new Fetch(config.get('api.baseUrl'));

export default async function Page({ params }: { params: { slug: string } }): Promise<JSX.Element> {
  const {slug} = params;
  const timeline = await f.getTimeline(slug);

  if (!timeline) {
    notFound();
  }

  return (
    <main>
      <Container>
        <TimelineNavigator timeline={timeline} />
      </Container>
    </main>
  );
}
