import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

export default function Loading(): JSX.Element {
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container>
        <Grid2 md={6} sm={12}>
          <Typography color="text.primary" variant="h2">
            <Skeleton />
          </Typography>
          <Typography color="text.secondary" variant="body2">
            <Skeleton />
          </Typography>
        </Grid2>
        <Grid2 md={6}>
          <Box display="flex" justifyContent="flex-end">
            <Skeleton>
              <Button color="primary" startIcon={<AddIcon />} variant="contained">
                Create New Entry
              </Button>
            </Skeleton>
          </Box>
        </Grid2>
      </Grid2>
      <Skeleton height={600} width="100%" />
    </Box>
  );
}
