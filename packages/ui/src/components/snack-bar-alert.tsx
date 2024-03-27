import React from 'react';
import type { AlertColor } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import {Alert} from './alert';

interface SnackBarAlertProps {
  message: string
  severity?: AlertColor
  clear: () => void
  autoHide?: number
}

export function SnackBarAlert({ message, severity = 'error', clear, autoHide = 6000 }: SnackBarAlertProps): JSX.Element {
  const handleClose = (/* event?: React.SyntheticEvent | Event, reason?: string */): void => {
    clear();
  }

  return (
    <Snackbar
      autoHideDuration={autoHide}
      onClose={handleClose}
      open={Boolean(message.length)}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackBarAlert;