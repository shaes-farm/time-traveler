import {Box, Link, Typography} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2

interface HeaderProps {
  app: {
    title: string;
    description: string;
  };
  baseUrl?: string;
  homePath?: string;
  aboutPath?: string;
  contactPath?: string;
}

export function Header(props: HeaderProps): JSX.Element {
  const {
    app: {
      title,
      description,
    },
    baseUrl = 'http://localhost:3000',
    homePath = '/',
    aboutPath = '/about',
    contactPath = '/contact',
  } = props;
  return (
    <header>
      <Box sx={{ m: '1em' }}>
        <Grid container spacing={2}>
          <Grid xs={8}>
            <Box sx={{ py: '1em' }}>
              <Typography component="h1" variant="h4">
                {title}
              </Typography>
              <Typography color="text.secondary" component="div" variant="body1">
                {description}
              </Typography>
            </Box>
          </Grid>            
          <Grid sx={{ alignSelf: 'start' }} xs={4}>
            <Typography component="span" sx={{ display: "flex", justifyContent: "end" }} variant="body2">
              <Link
                  color="inherit"
                  href={new URL(homePath, baseUrl).toString()}
                  underline="hover"
                >
                  home
              </Link>
              &nbsp;|&nbsp;
              <Link
                color="inherit"
                href={new URL(aboutPath, baseUrl).toString()}
                underline="hover"
              >
                about
              </Link>
              &nbsp;|&nbsp;
              <Link
                color="inherit"
                href={new URL(contactPath, baseUrl).toString()}
                underline="hover"
              >
                contact
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </header>
  );
}
