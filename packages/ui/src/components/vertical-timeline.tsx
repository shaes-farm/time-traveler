'use client'
// import NextLink from 'next/link';
import {Link, Typography} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import type {Timeline as ITimeline} from 'service';

interface VerticalTimelineProps {
  timeline: ITimeline;
  alternate?: boolean;
  reverse?: boolean;
};

const getPosition = (alternate: boolean, reverse: boolean): "alternate" | "left" | "right" | "alternate-reverse" | undefined => {
  return alternate ? (reverse ? "alternate-reverse" : "alternate") : (reverse ? "left" : "right");
};

export function VerticalTimeline(props: VerticalTimelineProps): JSX.Element {
  const {timeline, alternate = false, reverse = false} = props;
  return (
    <Timeline position={getPosition(alternate, reverse)}>
      {timeline.events.map((event, index) => (
        <TimelineItem key={Symbol(index).toString()}>
          {event.beginDate ? <TimelineOppositeContent color="secondary" variant="h6">
            {event.beginDate}{event.endDate ? `-${event.endDate}` : null}
          </TimelineOppositeContent> : null}
          <TimelineSeparator>
            <TimelineDot color="primary" variant="outlined" />
            {index < (timeline.events.length-1) && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{py: '6px', px: 2}}>
            <Typography component="span" variant="h6">
              <Link color="inherit" href={`/events/${event.slug}`} underline="none">
                {event.title}
              </Link>
            </Typography>
            {event.summary ? <Typography color="text.secondary" component="div" variant="body2">
              {event.summary}
            </Typography> : null}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
