'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Paper,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';

interface ContentViewerProps {
  title: string;
  count?: number;
  createLink: string;
  children: React.ReactNode;
}

export function ContentViewer({ title, count, createLink, children }: ContentViewerProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container mb="1rem">
        <Grid md={6} sm={12}>
          <Typography variant="h1">
            {title}
          </Typography>
          <Typography color="text.secondary" variant="subtitle2">
            {`${count ? count : 'No'} entr${count === 1 ? 'y' : 'ies'} found`}
          </Typography>
        </Grid>
        <Grid md={6} sm={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button color="primary" onClick={() => { router.push(createLink) }} startIcon={<AddIcon />} variant="contained">
              Create New Entry
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Paper elevation={0}>
        {children}
      </Paper>
    </Box>
  );
}
