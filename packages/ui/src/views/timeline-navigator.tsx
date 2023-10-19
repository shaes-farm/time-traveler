'use client';
import {useState} from 'react';
import {Box, Container, Paper, Stack, Typography} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
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
    <Container>
      <Stack spacing={2}>
        <Paper elevation={3}>
          <Box sx={{ m: 2, py: 1, textAlign: 'center' }}>
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
            <Grid md={5}>
              <Paper elevation={3}>
                <Typography component="h3" variant="h5">
                  Time span: {beginDate}-{endDate}
                </Typography>
                <Typography component="sub" variant="caption">
                  ({scale})
                </Typography>
                <EventTimeline
                  alternate={false}
                  events={timeline.events}
                  onSelect={(slug: string) => {
                    setEvent(timeline.events.find((e) => e.slug === slug) ?? null);
                  }}
                  opposite
                  outlined
                  reverse
                  summary={false}
                />
              </Paper>
            </Grid>
            <Grid md={7}>
              <Paper elevation={3}>
              {event ? <>
                <Typography variant="h3">
                  {event.title}
                </Typography>
                <Typography color="text.secondary" component="em" display="block">
                  {event.location}
                </Typography>
                <Typography color="text.secondary">
                  {event.beginDate}-{event.endDate}
                </Typography>
                <Typography py={2}>
                  {event.summary}
                </Typography>
                <Typography>
                  {event.media.map((item, index) => (
                    <div key={Symbol(index).toString()}>{item.caption}</div>
                  ))}
                </Typography>
                <Typography py={2}>
                  {event.detail}
                </Typography>
                </> : null}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Container>
  );
};
