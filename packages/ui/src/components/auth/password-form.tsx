'use client';
import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {Form} from '../form';
// import type {Credentials} from './_types';

export interface PasswordFormProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  signIn: (formData: FormData) => Promise<void>;
  // signIn: (credentials: Credentials) => Promise<void>;
  signUpUrl: string;
  forgotPasswordUrl: string;
  formProps?: Record<string,unknown>;
}

export function PasswordForm({
  icon,
  title,
  subTitle,
  signIn,
  signUpUrl,
  forgotPasswordUrl,
  ...formProps
}: PasswordFormProps): JSX.Element {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // const data = new FormData(event.currentTarget);
    // const credentials: Credentials = {
    //   email: data.get('email')?.toString() ?? '',
    //   password: data.get('password')?.toString() ?? '',
    //   remember: Boolean(data.get('remember')),
    // };
    void signIn(new FormData(event.currentTarget));
  };

  return (
    <Box
      sx={{
        my: 8,
        mx: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        {icon ?? <LockOutlinedIcon />}
      </Avatar>
      {title ? <Typography align="center" color="primary" component="h2" gutterBottom variant="h4">{title}</Typography> : null}
      {subTitle ? <Typography align="center" color="primary" component="h3" gutterBottom variant="h5">{subTitle}</Typography> : null}
      <Typography variant="body2">Sign in to continue.</Typography>
      <Form
        onSubmit={handleSubmit}
        sx={{ mt: 1 }}
        {...formProps}
      >
        <Grid container maxWidth={450} minWidth={300} spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoComplete="email"
              // autoFocus
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              placeholder="johndoe@email.com"
              required
              type="email"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoComplete="current-password"
              fullWidth
              id="password"
              label="Password"
              name="password"
              placeholder="password"
              required
              type="password"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox color="primary" value="me" />}
              label="Remember me"
              name="remember"
            />
          </Grid>
        </Grid>
        <Button
          fullWidth
          sx={{ mt: 3, mb: 2 }}
          type="submit"
          variant="contained"
        >
          Sign In
        </Button>
        <Grid container>
          <Grid item xs>
            <Link href={forgotPasswordUrl} variant="body2">
              Forgot password?
            </Link>
          </Grid>
          <Grid item>
            <Link href={signUpUrl} variant="body2">Don&apos;t have an account? Sign Up</Link>
          </Grid>
        </Grid>
      </Form>
    </Box>
  );
};

export default PasswordForm;
