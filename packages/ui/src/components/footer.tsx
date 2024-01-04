'use client';
import React from 'react';
import {Box, Divider, Link, Typography} from '@mui/material';
import {type LabeledRoute, Menu} from './menu';

export interface FooterProps {
  year: number;
  url: string;
  holder: string;
  menu: LabeledRoute[];
}

export function Footer(props: FooterProps): JSX.Element {
  const {
    year,
    url,
    holder,
    menu,
} = props;

  return (
    <footer>
      <Box sx={{ textAlign: 'center', py: '1em' }}>
        <Typography component="div" variant="body2">
          <Menu menu={menu} />
        </Typography>
        <Divider sx={{ my: '1em' }} />
        <Typography component="div" variant="body2">
          copyright &copy; {year}&nbsp;
          <Link
            color="inherit"
            href={url}
            underline="hover"
          >
            {holder.toLowerCase()}
          </Link>. all rights reserved.
        </Typography>
      </Box>
    </footer>      
  );
}
