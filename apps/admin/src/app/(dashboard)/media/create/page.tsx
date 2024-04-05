'use client'
import { useRouter } from 'next/navigation';
import BackIcon from '@mui/icons-material/ArrowBackIos';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { ContentEditor } from '../../../../components';
import { Upload } from './upload';

export default function Page(): JSX.Element {
  const router = useRouter();
  return (
    <ContentEditor title="Media">
      <Paper elevation={0} sx={{ p: '1rem', width: '100%' }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
            <Typography variant="h2">
              Upload Media
            </Typography>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={() => { router.back() }} startIcon={<BackIcon />} sx={{ px: 4 }} variant='outlined'>
              Back
            </Button>
          </Grid>
        </Grid>
        <Divider sx={{ my: '1rem' }} />
        <Upload />
      </Paper>
    </ContentEditor>
  );
}
