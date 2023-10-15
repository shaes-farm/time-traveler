'use client'
import type {Period} from 'service';
import {VerticalTimeline} from '../components';

interface PeriodTimelinesProps {
  period: Period;
  alternate?: boolean;
  reverse?: boolean;
};

export function PeriodTimelines(props: PeriodTimelinesProps): JSX.Element {
  const {period, ...rest} = props;
  return <VerticalTimeline markers={period.timelines} {...rest} />;
}
