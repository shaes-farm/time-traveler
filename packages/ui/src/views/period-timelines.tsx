'use client'
import type {Period} from 'service';
import {VerticalTimeline, type VerticalTimelineProps} from '../components';

export interface PeriodTimelinesProps extends Omit<VerticalTimelineProps, 'markers'>{
  period: Period;
};

export function PeriodTimelines(props: PeriodTimelinesProps): JSX.Element {
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
