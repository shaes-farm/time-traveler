import config from 'config';
// import Image from 'next/image'
import {Fetch} from 'service';
import {PeriodNavigator} from 'ui';
import styles from './page.module.css'

const {debug} = console;

const f = new Fetch(config.get('api.baseUrl'));

export default async function Home(): Promise<JSX.Element> {
  const periods = await f.getPeriods();
  debug({periods});

  return (
    <main className={styles.main}>
      <PeriodNavigator periods={periods} />
    </main>
  )
}
