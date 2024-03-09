import React from 'react';
import {
  Box,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({children}: LayoutProps): JSX.Element {
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container>
        <Grid2 md={6} sm={12}>
          <Typography color="text.primary" variant="h2">
            Edit Profile
          </Typography>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
