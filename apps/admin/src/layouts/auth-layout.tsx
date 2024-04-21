'use client';
import debugLogger from 'debug';
import { useEffect } from 'react';
import { Grid, Paper } from '@mui/material';
import { Copyright } from 'ui';
import { createClient } from '../utils/supabase/client';

const debug = debugLogger('admin:layouts:auth-layout');

interface AuthLayoutProps {
  name: string;
  url: string;
  year: number;
  children: React.ReactNode;
}

export function AuthLayout({ name, url, year, children }: AuthLayoutProps): JSX.Element {
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        debug(event, session)
      } else if (event === 'PASSWORD_RECOVERY') {
        debug(event, session);
      } else if (event === 'TOKEN_REFRESHED') {
        debug(event, session);
      } else if (event === 'USER_UPDATED') {
        debug(event, session);
      } else if (event === 'INITIAL_SESSION') {
        debug(event, session);
      } else {
        debug(event, session);
      }
    });
  });

  return (
    <Grid
      component="main"
      container
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[100],
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <Grid
        item
        md={7}
        sm={4}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?history)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        xs={false}
      />
      <Grid component={Paper} elevation={0} item md={5} sm={8} square xs={12}>
        {children}
        <Copyright holder={name} sx={{ mt: 5 }} url={url} year={year} />
      </Grid>
    </Grid>
  );
};
