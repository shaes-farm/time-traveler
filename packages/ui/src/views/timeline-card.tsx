'use client'
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';
import type {Timeline} from 'service';
import {CardButtons, MenuButton} from '../components';
import {EventTimeline, type EventTimelineProps} from './event-timeline';

const {debug} = console;

export interface TimelineCardProps extends Omit<EventTimelineProps, 'events'> {
  timeline: Timeline;
}

export function TimelineCard(props: TimelineCardProps): JSX.Element {
  const {
    timeline,
    alternate = true,
    colored = true,
    outlined = true,
    reverse = true,
  } = props;
  const {slug, title, summary, scale} = timeline;
  return (
    <Card sx={{ textAlign: 'center' }}>
      <CardHeader
        action={<MenuButton onDownload={() => {debug(`download ${slug}`)}} onPrint={() => {debug(`print ${slug}`)}} onShare={() => {debug(`share ${slug}`)}} />}
        subheader={summary}
        title={title}
      />
      <CardContent>
        {scale ? <Typography color="text.secondary" component="div" variant="body2">
          <em><sup>{scale}</sup></em>
        </Typography> : null}
        <EventTimeline
          alternate={alternate}
          colored={colored}
          events={timeline.events}
          outlined={outlined}
          reverse={reverse}
        />
      </CardContent>
      <CardActions disableSpacing>
      <CardButtons onLike={() => {debug(`like ${slug}`)}} onShare={() => {debug(`share ${slug}`)}} onSubscribe={() => {debug(`subscribe ${slug}`)}} />
      </CardActions>
    </Card>
  )
};
