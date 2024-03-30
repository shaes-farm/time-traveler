'use client';

import React, {useState} from 'react';
import { useRouter } from 'next/navigation';
import SaveIcon from '@mui/icons-material/Save';
import BackIcon from '@mui/icons-material/ArrowBackIos';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

interface EditorProps {
  title: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export function Editor({ title, onSubmit, children }: EditorProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  return (
    <Paper elevation={0} sx={{ p: '1rem' }}>
      <form
        onSubmit={
          (event: React.FormEvent<HTMLFormElement>): void => {
            setLoading(true);
            onSubmit(event);
          }
        }
      >
        <Grid container spacing={2}>
          <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
            <Typography variant="h2">
              {title}
            </Typography>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button disabled={loading} onClick={() => { router.back() }} startIcon={<BackIcon />} sx={{ px: 4 }} variant='outlined'>
              Back
            </Button>
            <Box sx={{ mx: 0.5 }} />
            <LoadingButton
              loading={loading}
              startIcon={<SaveIcon />}
              sx={{ px: 4 }}
              type="submit"
              variant='contained'
            >
              Save
            </LoadingButton>
          </Grid>
        </Grid>
        <Divider sx={{ my: '1rem' }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {children}
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
