'use client';
import {useState} from 'react';
import {Box, Paper, Stack, Typography} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // MUI Grid v2
import Markdown from 'react-markdown';
import type {Timeline, HistoricalEvent} from 'service';
import {EventTimeline} from './event-timeline';

export interface TimelineNavigatorProps {
  timeline: Timeline;
}

export function TimelineNavigator(props: TimelineNavigatorProps): JSX.Element {
  const {timeline} = props;
  const {title, summary, scale, beginDate, endDate} = timeline;
  const [event, setEvent] = useState<HistoricalEvent | null>(timeline.events[0] ?? null);

  return (
    <Stack spacing={2}>
      <Paper elevation={3} sx={{ py: 6, px: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2">
            {title}
          </Typography>
          <Typography gutterBottom>
            {summary}
          </Typography>
        </Box>
      </Paper>
      <Box sx={{ textAlign: 'center' }}>
        <Grid container spacing={2}>
          <Grid md={5} sm={12} xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography component="h3" variant="h5">
                {beginDate} to {endDate}
              </Typography>
              {scale ? <Typography component="sub" variant="caption">
                ({scale})
              </Typography> : null}
              <EventTimeline
                events={timeline.events}
                onSelect={(slug: string) => {
                  setEvent(timeline.events.find((e) => e.slug === slug) ?? null);
                }}
              />
            </Paper>
          </Grid>
          <Grid md={7} sm={12} xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              {event ? <>
                <Typography variant="h3">
                  {event.title}
                </Typography>
                {event.location ? <Typography color="text.secondary" component="em" display="block">
                  {event.location}
                </Typography> : null}
                <Typography color="text.secondary">
                  {event.beginDate}{event.endDate ? <>-{event.endDate}</> : null}
                </Typography>
                {event.summary ? <Typography py={2}>
                  {event.summary}
                </Typography> : null}
                {event.media.length ? <Typography>
                  {event.media.map((item, index) => (
                    <div key={Symbol(index).toString()}>{item.caption}</div>
                  ))}
                </Typography> : null}
                {event.detail ? 
                  <Box sx={{ textAlign: 'left' }}>
                    <Markdown>
                      {event.detail}
                    </Markdown>
                  </Box> : null}
              </> : null}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
};
