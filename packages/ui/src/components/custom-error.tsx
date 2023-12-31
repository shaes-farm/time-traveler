'use client';
import React from 'react';
import {Box, Container, Grid, Paper, Typography,} from '@mui/material';

export interface CustomErrorProps {
  dump?: unknown;
  message: string;
  status?: number;
}

export function CustomError(props: CustomErrorProps): JSX.Element {
  const {dump, status, message} = props;
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
            <Paper>
              <Typography align="center" color="text.secondary" component="span" variant="h6">
                <pre>
                  {JSON.stringify(dump, null, 4)}
                </pre>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
