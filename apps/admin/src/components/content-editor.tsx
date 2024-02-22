'use client';
import React from 'react';
import {useRouter} from 'next/navigation';
import {
  Box,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface ContentEditorProps {
  title: string;
  backLink?: string;
  children: React.ReactNode;
}

export function ContentEditor({ title, backLink, children }: ContentEditorProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container mb="1em">
        <Grid2 xs={12}>
          <Typography color="text.primary" variant="h2">
            {title}
          </Typography>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
