'use client'
import {Box, Container, Grid, Typography,} from '@mui/material';

interface CustomErrorProps {
  status?: number;
  message: string;
}

export function CustomError(props: CustomErrorProps): JSX.Element {
  const {status, message} = props;
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Box display="flex" flexDirection="row" height="100vh">
        <Grid alignItems="center" container direction="row" item justifyContent="center">
          <Typography align="center" component="div" variant="h6">
            {status ? `${status} | ` : null}{message}
          </Typography>
        </Grid>
      </Box>
    </Container>
  );
}
