'use client';
import React from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

export interface CopyrightProps {
  /**
   * The copyright holder.
   */
  holder: string
  /**
   * The URL of the copyright holder.
   */
   url: string
   /**
   * The year the copyright went into effect.
   */
  year: number
}

function CopyrightBase({holder, year, url, ...typoProps}: CopyrightProps): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <Typography align="center" color="text.secondary" variant="body2" {...typoProps}>
      {'Copyright © '}
      {year === currentYear ? year : `${year}-${currentYear}`}
      {' by '}
      <Link color="inherit" href={url} target='_blank'>
        {holder}
      </Link>
    </Typography>
  );
};

/**
 * Display a copyright message formatted according to the standards of the United States.
 */
export const Copyright = styled(CopyrightBase)({});

export default Copyright;
