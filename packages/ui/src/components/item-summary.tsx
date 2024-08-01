'use client';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useProfile } from '../providers';

interface ItemSummaryProps {
  published: boolean;
  publishedAt: string | null;
  url: URL | string;
  title: string;
  onPublish: (slug: string) => boolean;
  onDelete: (slug: string) => void;
}

export function ItemSummary({ published, publishedAt, url, title }: ItemSummaryProps): JSX.Element {
  const { profile } = useProfile();

  return (
    <Card variant="outlined">
      <CardActionArea>
        <CardHeader
          sx={{ px: 2, py: 1 }}
          title={
            <Typography sx={{ my: 1 }} variant="h3">
              {title}
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          <TableContainer>
            <Table aria-label="summary" size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Visibility</TableCell>
                  <TableCell>{published ? 'Public' : 'Draft'}</TableCell>
                </TableRow>
                {published ? <TableRow>
                  <TableCell>Published Date</TableCell>
                  <TableCell>{publishedAt}</TableCell>
                </TableRow> : null}
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>
                    {url.toString()}
                    <Tooltip placement="top" title="Visit site">
                      <IconButton
                        aria-label="visit site"
                        edge="end"
                        onClick={() => { window.open(url) }}
                        size="small"
                      >
                        <OpenInNewIcon sx={{ height: '0.75em', width: '0.75em' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Author</TableCell>
                  <TableCell>{profile.firstName}&nbsp;{profile.lastName}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Grid container spacing={2}>
          <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button color="primary" variant="outlined">{published ? 'Switch to draft' : 'Publish'}</Button>
            <Box sx={{ mx: 0.5 }} />
            <Button color="error" variant="outlined">Delete</Button>
          </Grid>
        </Grid>
      </CardActions>
    </Card >
  );
}
