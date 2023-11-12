'use client'
import React from 'react';
import {Box, Container, Grid, Typography,} from '@mui/material';

export default function Custom500() {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Box display="flex" flexDirection="row" height="100vh">
        <Grid alignItems="center" container direction="row" item justifyContent="center">
          <Typography align="center" component="div" variant="h6">
          500 | This page caused bad things to happen.
          </Typography>
        </Grid>
      </Box>
    </Container>
  );
}
