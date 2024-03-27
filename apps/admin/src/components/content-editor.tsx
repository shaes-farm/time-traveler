'use client';
import React from 'react';
import {
  Box,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';

interface ContentEditorProps {
  title: string;
  children: React.ReactNode;
}

export function ContentEditor({ title, children }: ContentEditorProps): JSX.Element {
  return (
    <Box width="100%">
      <Grid container>
        <Grid mb="1em" xs={12}>
          <Typography variant="h1">
            {title}
          </Typography>
        </Grid>
        <Grid>
          {children}
        </Grid>
      </Grid>
    </Box>
  );
}
