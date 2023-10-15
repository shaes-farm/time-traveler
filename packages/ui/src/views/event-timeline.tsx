'use client'
import type {HistoricalEvent} from 'service';
import {VerticalTimeline} from '../components';

interface EventTimelineProps {
  events: HistoricalEvent[];
  alternate?: boolean;
  reverse?: boolean;
};

export function EventTimeline(props: EventTimelineProps): JSX.Element {
  const {events, ...rest} = props;
  return <VerticalTimeline markers={events} {...rest} />;
}
