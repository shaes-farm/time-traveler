'use client';
import React from 'react';
import {Box, Typography} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import {type LabeledRoute, Menu} from './menu';

export interface HeaderProps {
  app: {
    title: string;
    description: string;
  };
  menu: LabeledRoute[];
}

export function Header(props: HeaderProps): JSX.Element {
  const {
    app: {
      title,
      description,
    },
    menu,
  } = props;

  return (
    <header>
        <Grid container spacing={2} sx={{ py: 2 }}>
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
              <Menu menu={menu} />
            </Typography>
          </Grid>
        </Grid>
    </header>
  );
}
