'use client';
import { Grid, Paper } from '@mui/material';
import { Copyright } from 'ui';

interface AuthLayoutProps {
  name: string;
  url: string;
  year: number;
  children: React.ReactNode;
}

export function AuthLayout({ name, url, year, children }: AuthLayoutProps): JSX.Element {
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
          backgroundColor: (t) =>
            t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.grey[50],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        xs={false}
      />
      <Grid component={Paper} elevation={6} item md={5} sm={8} square xs={12}>
        {children}
        <Copyright holder={name} sx={{ mt: 5 }} url={url} year={year} />
      </Grid>
    </Grid>
  );
};
