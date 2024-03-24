'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SaveIcon from '@mui/icons-material/Save';
import BackIcon from '@mui/icons-material/ArrowBackIos';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  Form,
} from 'ui';

interface EditorProps {
  title: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export function Editor({ title, onSubmit, children }: EditorProps): JSX.Element {
  const router = useRouter();

  return (
    <Paper elevation={0} sx={{ p: '1rem' }}>
      <Form onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
            <Typography variant="h2">
              {title}
            </Typography>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={() => { router.back() }} startIcon={<BackIcon />} sx={{ px: 4 }} variant='outlined'>
              Back
            </Button>
            <Box sx={{ mx: 0.5 }} />
            <Button startIcon={<SaveIcon />} sx={{ px: 4 }} type="submit" variant='contained'>
              Save
            </Button>
          </Grid>
        </Grid>
        <Divider sx={{ my: '1rem' }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {children}
          </Grid>
        </Grid>
      </Form>
    </Paper>
  );
}
