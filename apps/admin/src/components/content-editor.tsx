'use client';
import React from 'react';
import {useRouter} from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Typography,
  Unstable_Grid2 as Grid2
} from '@mui/material';

interface ContentEditorProps {
  title: string;
  children: React.ReactNode;
}

export function ContentEditor({ title, children }: ContentEditorProps): JSX.Element {
  const router = useRouter();
  return (
    <Box sx={{ p: '1em', mt: '3em', width: '100%' }}>
      <Grid2 container mb="1em">
        <Grid2 xs={12}>
          <Button aria-label="back" color="secondary" onClick={() => {router.back()}}>
            <ArrowBackIcon />&nbsp;Back
          </Button>
          <Typography color="text.primary" variant="h2">
            {title}
          </Typography>
        </Grid2>
      </Grid2>
      {children}
    </Box>
  );
}
