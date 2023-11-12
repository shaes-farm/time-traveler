'use client'
import React from 'react';
import {Box, Container, Grid, Typography,} from '@mui/material';

export default function Custom404() {
  return (
    <Container maxWidth="lg" sx={{ m: 'auto' }}>
      <Box display="flex" flexDirection="row">
        <Grid alignItems="center" container direction="row" item justifyContent="center">
          <Typography align="center" component="div" variant="h6">
          404 | This page could not be found.
          </Typography>
        </Grid>
      </Box>
    </Container>
  );
}
