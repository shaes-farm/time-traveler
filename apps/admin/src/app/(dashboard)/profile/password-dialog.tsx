'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import TextField from '@mui/material/TextField';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { updatePassword, type ActionResult } from './actions';

interface PasswordDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setResult: (result: ActionResult) => void;
}

export function PasswordDialog({ open, setOpen, setResult }: PasswordDialogProps): JSX.Element {
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const handleClickShowPassword = (): void => { setShowPassword((show) => !show) };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  return (
    <Dialog
      PaperProps={{
        component: 'form',
        onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const password = formData.get('password') as string;
          const newPassword = formData.get('newPassword') as string;
          const result = await updatePassword(password, newPassword);
          setResult(result);
          handleClose();
        },
        sx: {border: '1px solid #ddd'},
      }}
      onClose={handleClose}
      open={open}
    >
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter your current password, and then choose a new password.
        </DialogContentText>
        <Grid container spacing={2}>
          <Grid sx={{ mt: '.5rem', color: 'lightgray' }}>
            Make sure that your new password meets these requirements:
            <ul>
              <li>Is at least eight (8) characters long.</li>
              <li>Contains upper and lower case letters, digits, and symbols.</li>
              <li><em>Is not</em> the same as your user name.</li>
            </ul>
          </Grid>
          <Grid display="flex" xs={12}>
            <TextField
              autoComplete="current-password"
              fullWidth
              id="password"
              label="Current Password"
              name="password"
              required
              type="password"
            />
          </Grid>
          <Grid display="flex" xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
              <OutlinedInput
                autoComplete="new-password"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      edge="end"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                }
                id="newPassword"
                label="Password"
                name="newPassword"
                required
                type={showPassword ? 'text' : 'password'}
              />
            </FormControl>
            {/* <TextField
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">
                    <VisibilityIcon />
                  </InputAdornment>
                ),
              }}
              autoComplete="new-password"
              fullWidth
              id="newPassword"
              label="New Password"
              name="newPassword"
              required
              type="password"
            /> */}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Update</Button>
      </DialogActions>
    </Dialog>
  );
}