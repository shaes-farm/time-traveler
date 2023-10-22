'use client'
import type {Period} from 'service';
import {VerticalTimeline, type VerticalTimelineProps} from '../components';

export interface PeriodTimelineProps extends Omit<VerticalTimelineProps, 'markers'>{
  period: Period;
  onSelect: (slug: string) => void;
};

export function PeriodTimeline(props: PeriodTimelineProps): JSX.Element {
  const {
    period,
    alternate = true,
    colored = true,
    onSelect,
    outlined = true,
    reverse = false,
  } = props;
  return (
    <VerticalTimeline
      alternate={alternate}
      colored={colored}
      markers={period.timelines}
      onSelect={onSelect}
      outlined={outlined}
      reverse={reverse}
    />
  );
}
