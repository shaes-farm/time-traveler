'use client'
import type {HistoricalEvent} from 'service';
import {VerticalTimeline, type VerticalTimelineProps} from '../components';

export interface EventTimelineProps extends Omit<VerticalTimelineProps, 'markers'>{
  events: HistoricalEvent[];
  onSelect: (slug: string) => void;
};

export function EventTimeline(props: EventTimelineProps): JSX.Element {
  const {
    events,
    colored = true,
    onSelect,
    opposite = true,
    outlined = true,
    reverse = true,
    ...rest
  } = props;
  return (
    <VerticalTimeline
      colored={colored}
      markers={events}
      onSelect={onSelect}
      opposite={opposite}
      outlined={outlined}
      reverse={reverse}
      {...rest}
    />
  );
}
