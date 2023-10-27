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
    opposite = true,
    outlined = true,
    summary = true,
    ...rest
  } = props;
  return (
    <VerticalTimeline
      alternate={alternate}
      colored={colored}
      markers={period.timelines}
      onSelect={onSelect}
      opposite={opposite}
      outlined={outlined}
      summary={summary}
      {...rest}
    />
  );
}
