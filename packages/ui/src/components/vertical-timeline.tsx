'use client'
import React from 'react';
import {Button, Typography} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
// import {Link} from './link';

const getAlternateState = (reverse: boolean): "alternate" | "alternate-reverse" =>
  reverse ? "alternate-reverse" : "alternate";

const getReverseState = (reverse: boolean): "left" | "right" =>
  reverse ? "left" : "right";

const getPosition = (alternate: boolean, reverse: boolean): "alternate" | "alternate-reverse" | "left" | "right" =>
  alternate ?  getAlternateState(reverse) : getReverseState(reverse);

export interface TimelineMarker {
  slug: string;
  title: string;
  summary: string | null;
  beginDate: string;
  endDate: string | null;
}

interface VerticalTimelineProps {
  markers: TimelineMarker[];
  alternate?: boolean;
  colored?: boolean;
  opposite?: boolean;
  outlined?: boolean;
  reverse?: boolean;
  summary?: boolean;
  sx?: object;
  onSelect: (slug: string) => void;
};

export function VerticalTimeline(props: VerticalTimelineProps): JSX.Element {
  const {
    markers,
    alternate = false,
    colored = false,
    opposite = false,
    outlined = false,
    reverse = false,
    summary = false,
    sx,
    onSelect,
  } = props;
  return (
    <Timeline position={getPosition(alternate, reverse)} sx={sx}>
      {markers.map((marker, index) => (
        <TimelineItem key={Symbol(index).toString()}>
          {opposite && marker.beginDate ? <TimelineOppositeContent color={colored ? "secondary" : "text.secondary"} sx={{ pt: 1.5 }} variant="body2">
            {marker.beginDate}{marker.endDate && marker.endDate !== marker.beginDate ? `-${marker.endDate}` : null}
          </TimelineOppositeContent> : null}
          <TimelineSeparator>
            <TimelineDot color={colored ? "primary" : "grey"} variant={outlined ? "outlined" : "filled"} />
            {index < (markers.length-1) && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography component="span" variant="h6">
              <Button
                disableRipple
                onClick={() => {
                  onSelect(marker.slug);
                }}
                variant="text"
              >
                {marker.title}
              </Button>
            </Typography>
            {summary && marker.summary ? <Typography color="text.secondary" component="div" variant="body2">
              {marker.summary}
            </Typography> : null}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
