'use client'
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';
import type {Timeline} from 'service';
import {VerticalTimeline} from '../components/vertical-timeline';
import {MenuButton} from '../components/menu-button';
import {CardButtons} from '../components/card-buttons';

interface TimelineCardProps {
  timeline: Timeline;
}

export function TimelineCard(props: TimelineCardProps): JSX.Element {
  const {timeline} = props;
  const {title, summary, scale} = timeline;
  return (
    <Card sx={{ textAlign: 'center' }}>
      <CardHeader
        action={<MenuButton />}
        subheader={summary}
        title={title}
      />
      <CardContent>
        {scale ? <Typography color="text.secondary" component="div" variant="body2">
          <em><sup>{scale}</sup></em>
        </Typography> : null}
        <VerticalTimeline alternate reverse timeline={timeline} />
      </CardContent>
      <CardActions disableSpacing>
        <CardButtons />
      </CardActions>
    </Card>
  )
};
