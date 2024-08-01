import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  // Link,
  Unstable_Grid2 as Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { getAppConfig } from '../../../utils/config';
import { Link } from '../../../components';
import { getMetrics } from './actions';

const {
  title,
  version,
} = getAppConfig();

export default async function Page(): Promise<JSX.Element> {
  const metrics = await getMetrics();

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: '1rem' }}>
        <Box my={5} textAlign="left" width="100%">
          <Typography color="text.primary" component="h1" variant="h1">
            Welcome to {title}!
          </Typography>
          <Typography variant="h4">
            <Link href="/help/about">
              Learn more about the {version} version
            </Link>
          </Typography>
        </Box>
        <Divider />
        <Grid container spacing={2}>
          <Grid md={4} sm={6} xs={12}>
            <Box my={2}>
              <Typography color="text.primary" component="h2" variant="h3">
                Tell the stories of history as they happened
              </Typography>
            </Box>
            <Box mb={1}>
              <Typography color="text.secondary" variant="body2">
                By documenting history in a linear progression, it allows us to clearly see the play of cause and effect over time, as the events unfold.
              </Typography>
            </Box>
            <Link href="/stories/create">
              Add a new story
            </Link>
          </Grid>
          <Grid md={4} sm={6} xs={12}>
            <Box my={2}>
              <Typography color="text.primary" component="h2" variant="h3">
                Author rich content with prose and media
              </Typography>
            </Box>
            <Box mb={1}>
              <Typography color="text.secondary" variant="body2">
                Document your stories by including pictures, video, audio recordings, documents -- the complete array of historical artifacts.
              </Typography>
            </Box>
            <Link href="/media/create">
              Upload new media
            </Link>
          </Grid>
          <Grid md={4} sm={6} xs={12}>
            <Box my={2}>
              <Typography color="text.primary" component="h2" variant="h3">
                Search and integrate information
              </Typography>
            </Box>
            <Box mb={1}>
              <Typography color="text.secondary" variant="body2">
                With the collaborative features of the platform, users can share research information with each other to fill in missing pieces of the puzzle.
              </Typography>
            </Box>
            <Link href="/media/create">
              Share a story
            </Link>
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={2}>
        <Grid md={6} sm={12}>
          <Card>
            <CardHeader title={<Typography component="h3" variant="h4">Quick Draft</Typography>} />
            <Divider />
            <CardContent>
              Title<br /><input /><br />
              Content<br /><textarea /><br />
              <button type="button">Save Draft</button>
            </CardContent>
            <Divider />
            <CardContent>
              Your Recent Drafts<br />
              ...<br />
            </CardContent>
          </Card>
        </Grid>
        <Grid md={6} sm={12}>
          <Card>
            <CardHeader title={<Typography component="h3" variant="h4">At a Glance</Typography>} />
            <Divider />
            <CardContent>
              {metrics?.storyCount ?? '0'} <Link href="/stories">stories</Link><br />
              {metrics?.periodCount ?? '0'} <Link href="/periods">periods</Link><br />
              {metrics?.timelineCount ?? '0'} <Link href="/timelines">timelines</Link><br />
              {metrics?.eventCount ?? '0'} <Link href="/events">events</Link><br />
              {metrics?.categoryCount ?? '0'} <Link href="/categories">categories</Link><br />
              {metrics?.mediaCount ?? '0'} <Link href="/media">media</Link><br />
            </CardContent>
            <Divider />
            <CardContent>
              Secondary content
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
