'use client'
import type {Period} from 'service';
import {VerticalTimeline} from '../components';

interface PeriodTimelineProps {
  period: Period;
  alternate?: boolean;
  reverse?: boolean;
};

export function PeriodTimeline(props: PeriodTimelineProps): JSX.Element {
  const {period, ...rest} = props;
  return <VerticalTimeline markers={period.timelines} {...rest} />;
}
