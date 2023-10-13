'use client'
import React from 'react';
// import Image from 'next/image';
import {Card, CardActions, CardContent, CardHeader, Grid, Typography} from '@mui/material';
// import Carousel from 'react-material-ui-carousel'
import type {HistoricalEvent/* , HistoricalEventMedia */} from 'service';
import {MenuButton} from '../components/menu-button';
import {CardButtons} from '../components/card-buttons';

// function MediaItem(m: HistoricalEventMedia): JSX.Element {
//   return (
//     <>
//       <Image alt={m.alternativeText} height={m.height} src={m.url} width={m.width} />
//       {m.caption || m.alternativeText && <Typography component="sup">
//         {m.caption ? m.caption : m.alternativeText}
//       </Typography>}
//     </>
//   );
// }

// function ImageCarousel(media?: HistoricalEventMedia[]): JSX.Element {
//   if (!media?.length) return <></>;
//   return (
//     <Carousel>
//       {media.map((m, i): JSX.Element => (
//         <MediaItem key={Symbol(i).toString()} {...m} />
//       ))}
//     </Carousel>
//   );
// }

interface HistoricalEventCardProps {
  event: HistoricalEvent;
}

export function HistoricalEventCard(props: HistoricalEventCardProps): JSX.Element {
  const {title, summary, location, beginDate, endDate} = props.event;
  return (
    <Card sx={{ textAlign: 'center' }}>
      <CardHeader
        action={<MenuButton />}
        subheader={`${location ? location : ''}${location && beginDate ? ' - ' : ''}${beginDate ? beginDate : ''}`}
        title={title}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item md={9} xs={12}>
            <Typography color="text.secondary" component="div" variant="body2">
              {summary}
            </Typography>
          </Grid>
          <Grid item md={3}>
            Date: {beginDate}{endDate ? `-${endDate}` : ''}
          </Grid>
        </Grid>
      </CardContent>
      <CardActions disableSpacing>
        <CardButtons />
      </CardActions>
    </Card>
  );
}
