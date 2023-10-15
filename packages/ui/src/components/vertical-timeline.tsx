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

interface TimelineMarker {
  slug: string;
  title: string;
  summary: string | null;
  beginDate: string;
  endDate: string | null;
}

interface VerticalTimelineProps {
  markers: TimelineMarker[];
  alternate?: boolean;
  reverse?: boolean;
};

const getAlternateState = (reverse: boolean): "alternate" | "alternate-reverse" =>
  reverse ? "alternate-reverse" : "alternate";

const getReverseState = (reverse: boolean): "left" | "right" =>
  reverse ? "left" : "right";
  
const getPosition = (alternate: boolean, reverse: boolean): "alternate" | "left" | "right" | "alternate-reverse" =>
  alternate ?  getAlternateState(reverse) : getReverseState(reverse);

export function VerticalTimeline(props: VerticalTimelineProps): JSX.Element {
  const {markers, alternate = false, reverse = false} = props;
  return (
    <Timeline position={getPosition(alternate, reverse)}>
      {markers.map((marker, index) => (
        <TimelineItem key={Symbol(index).toString()}>
          {marker.beginDate ? <TimelineOppositeContent color="secondary" variant="h6">
            {marker.beginDate}{marker.endDate && marker.endDate !== marker.beginDate ? `-${marker.endDate}` : null}
          </TimelineOppositeContent> : null}
          <TimelineSeparator>
            <TimelineDot color="primary" variant="outlined" />
            {index < (markers.length-1) && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{py: '6px', px: 2}}>
            <Typography component="span" variant="h6">
              <Link color="inherit" href={`/events/${marker.slug}`} underline="none">
                {marker.title}
              </Link>
            </Typography>
            {marker.summary ? <Typography color="text.secondary" component="div" variant="body2">
              {marker.summary}
            </Typography> : null}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
