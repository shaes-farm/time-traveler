import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface SpinnerProps {
  width?: number;
  height?: number;
}
export function Spinner({height, width}: SpinnerProps): JSX.Element {
  return (
    <Box height={height ?? '100dvh'} sx={{ display: 'flex' }} width={width ?? '100dvh'}>
      <Box sx={{ alignSelf: 'center'}} >
        <CircularProgress />
      </Box>
    </Box>
  );
}
