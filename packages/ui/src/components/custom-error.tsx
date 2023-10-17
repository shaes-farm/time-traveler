'use client'
import {Box, Container, Grid, Typography,} from '@mui/material';

export interface CustomErrorProps {
  status?: number;
  message: string;
}

export function CustomError(props: CustomErrorProps): JSX.Element {
  const {status, message} = props;
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Box display="flex" flexDirection="row" height="100vh">
        <Grid alignItems="center" container direction="row" item justifyContent="center">
          <Grid item>
            {status ? <><Typography color="text.secondary" component="span" variant="h6">
              {status}
            </Typography>
            <Typography color="text.primary" component="span" variant="h6">
              &nbsp;|&nbsp;
            </Typography></>: null}
            <Typography align="center" color="text.secondary" component="span" variant="h6">
              {message}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
