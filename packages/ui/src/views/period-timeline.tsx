'use client'
import type {Period} from 'service';
import {VerticalTimeline, type VerticalTimelineProps} from '../components';

export interface PeriodTimelineProps extends Omit<VerticalTimelineProps, 'markers'>{
  period: Period;
};

export function PeriodTimeline(props: PeriodTimelineProps): JSX.Element {
  const {
    period,
    alternate = true,
    colored = true,
    outlined = true,
    reverse = false,
  } = props;
  return (
    <VerticalTimeline
      alternate={alternate}
      colored={colored}
      markers={period.timelines}
      outlined={outlined}
      reverse={reverse}
    />
  );
}
