'use client'
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';
import type {Timeline} from 'service';
import {CardButtons, MenuButton} from '../components';
import {EventTimeline, type EventTimelineProps} from './event-timeline';

const {debug} = console;

export interface TimelineCardProps extends Omit<EventTimelineProps, 'events'> {
  timeline: Timeline;
  onSelect: (slug: string) => void;
}

export function TimelineCard(props: TimelineCardProps): JSX.Element {
  const {timeline, ...rest} = props;
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
        <EventTimeline events={timeline.events} {...rest} />
      </CardContent>
      <CardActions disableSpacing>
        <CardButtons onLike={() => {debug(`like ${slug}`)}} onShare={() => {debug(`share ${slug}`)}} onSubscribe={() => {debug(`subscribe ${slug}`)}} />
      </CardActions>
    </Card>
  )
};
