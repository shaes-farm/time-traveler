import config from 'config';
// import Image from 'next/image'
import {Fetch} from 'service';
import {
  HorizontalStepper,
  VerticalTimeline,
} from 'ui';
import styles from './page.module.css'

const {debug} = console;

const f = new Fetch(config.get('api.baseUrl'));

export default async function Home(): Promise<JSX.Element> {
  const periods = await f.getPeriods();
  const timelines = await f.getTimelines();

  debug({periods});

  return (
    <main className={styles.main}>
      <HorizontalStepper steps={
        periods.map((period) => ({
          label: period.title,
          link: `/periods/${period.slug}`,
        }))
      } />
      <VerticalTimeline timeline={timelines[0]} />
    </main>
  )
}
