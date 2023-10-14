import {Box, Container, Paper, Typography} from '@mui/material';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {WorldMap} from '../components/world-map';
import {HorizontalStepper} from '../components/horizontal-stepper';
import {config} from './config';

const {baseUrl} = config.app;

const headerMenu = [{
  label: 'home',
  route: '/',
},{
  label: 'about',
  route: '/about',
},{
  label: 'contact',
  route: '/contact',
}];

const footerMenu = [{
  label: 'disclaimer',
  route: '/disclaimer',
},{
  label: 'privacy policy',
  route: '/privacy',
},{
  label: 'terms of use',
  route: '/terms',
}];

const periods = [{
  label: 'The First Age',
  route: `${baseUrl}/timelines/the-first-age`,
},{
  label: 'The Second Age',
  route: `${baseUrl}/timelines/the-second-age`,
},{
  label: 'The Third Age',
  route: `${baseUrl}/timelines/the-third-age`,
},{
  label: 'The Fourth Age',
  route: `${baseUrl}/timelines/the-fourth-age`,
},{
  label: 'The Fifth Age',
  route: `${baseUrl}/timelines/the-fifth-age`,
}];

export function Page(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Header app={config.app} menu={headerMenu} />
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
                {coordinates: [-74.006, 40.7128], label: 'New York', labelY: -8, dx: 10, dy: -20, anchor: 'start'},
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
      <Footer app={config.app} menu={footerMenu} />
    </Container>
  );
};
