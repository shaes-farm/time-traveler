import React from 'react';
import {Box, Paper, Typography} from '@mui/material';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {WorldMap} from '../components/world-map';
import {HorizontalStepper} from '../components/horizontal-stepper';

const config = {
  app: {
    baseUrl: 'http://localhost:6006',
    title: 'The Application Title',
    description: 'The application sub-title / description',
    copyright: {
      year: 2023,
      url: 'http://example.com',
      holder: 'Jimbo Pickins',
    }
  }
}

const baseUrl: string = config.app.baseUrl;

const periods = [{
  label: 'The First Age',
  link: `${baseUrl}/timelines/the-bronze-age`,
},{
  label: 'The Second Age',
  link: `${baseUrl}/timelines/the-iron-age`,
},{
  label: 'The Third Age',
  link: `${baseUrl}/timelines/the-dark-age`,
},{
  label: 'The Fourth Age',
  link: `${baseUrl}/timelines/the-enlightened-age`,
},{
  label: 'The Fifth Age',
  link: `${baseUrl}/timelines/the-awakened-age`,
}];

export function Page(): JSX.Element {
  return (<>
    <Header app={config.app}/>
    <main>
      <Paper>
        <Box sx={{py: '3em'}}>
          <Typography component="h2" sx={{textAlign: 'center'}} variant="h4">
            The Home Page Hero Banner Text
          </Typography>
          <Typography color="text.secondary" component="h3" sx={{textAlign: 'center'}} variant="h5">
            The Home Page Hero Banner Sub-Text
          </Typography>
        </Box>
        <Paper elevation={24}>
          <WorldMap
            annotations={[
              {coordinates: [-74.006, 40.7128], label: 'New York', labelY: -8, dx: -10, dy: -20, anchor: 'end'},
              {coordinates: [12.51133, 41.89193], label: 'Rome', labelY: -8, dx: -10, dy: -20, anchor: 'end'},
              {coordinates: [28.94966, 41.01384], label: 'Istanbul', labelY: -8, dx: 10, dy: -20, anchor: 'start'},
            ]}
            center={[0,0]}
            graticule
            markers={[
              {coordinates: [-74.006, 40.7128], style: 'dot', radius: 2},
              {coordinates: [12.51133, 41.89193], style: 'dot', radius: 2},
              {coordinates: [28.94966, 41.01384], style: 'dot', radius: 2},
              {coordinates: [-101, 53], style: 'text', text: 'Canada'},
              {coordinates: [-102, 38], style: 'text', text: 'USA'},
              {coordinates: [-103, 25], style: 'text', text: 'Mexico'},
            ]}
            zoom={1}
          />
        </Paper>
        <Box sx={{py: '3em'}}>
          <HorizontalStepper steps={periods} />
        </Box>
      </Paper>
    </main>
    <Footer app={config.app}/>
  </>);
};
