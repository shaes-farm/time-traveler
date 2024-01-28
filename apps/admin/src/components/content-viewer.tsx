'use client';
import React from 'react';
import {useRouter} from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface ContentViewerProps {
  title: string;
  count?: number;
  createLink: string;
  children: React.ReactNode;
}

export function ContentViewer({title, count, createLink, children}: ContentViewerProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container>
        <Grid2 md={6} sm={12}>
          <Button aria-label="back" onClick={() => {router.back()}}>
            <ArrowBackIcon />&nbsp;Back
          </Button>
          <Typography color="text.primary" variant="h2">
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {`${count ? count : 'No'} entries found`}
          </Typography>
        </Grid2>
        <Grid2 md={6}>
          <Box display="flex" justifyContent="flex-end">
            <Button color="primary" onClick={() => {router.push(createLink)}} startIcon={<AddIcon />} variant="contained">
              Create New Entry
            </Button>
          </Box>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
