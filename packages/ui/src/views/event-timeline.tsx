'use client'
import type {HistoricalEvent} from 'service';
import {VerticalTimeline, type VerticalTimelineProps} from '../components';

export interface EventTimelineProps extends Omit<VerticalTimelineProps, 'markers'>{
  events: HistoricalEvent[];
};

export function EventTimeline(props: EventTimelineProps): JSX.Element {
  const {events, ...rest} = props;
  return <VerticalTimeline markers={events} {...rest} />;
}
