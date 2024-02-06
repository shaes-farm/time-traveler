'use client';
import React from 'react';
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Link,
  Typography,
 } from '@mui/material';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import {Form} from '../form';
// import type {RecoverPasswordInfo} from './_types';

export interface RecoverPasswordFormProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  recoverPassword: (formData: FormData) => Promise<string>
  // recoverPassword: (info: RecoverPasswordInfo) => Promise<string>
  signInUrl: string;
  formProps?: object[];
}

export function RecoverPasswordForm({
  icon,
  title,
  subTitle,
  recoverPassword,
  signInUrl,
  ...formProps
}: RecoverPasswordFormProps): JSX.Element {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // const data = new FormData(event.currentTarget);
    // const info: RecoverPasswordInfo = {
    //   email: data.get('email')?.toString() ?? '',
    // };
    void recoverPassword(new FormData(event.currentTarget));
  };

  return (
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        {icon ?? <VpnKeyOutlinedIcon />}
      </Avatar>
      {title ? <Typography align="center" color="primary" component="h2" gutterBottom variant="h4">{title}</Typography> : null}
      {subTitle ? <Typography align="center" color="primary" component="h3" gutterBottom variant="h5">{subTitle}</Typography> : null}
      <Typography align="center" variant="caption">
        We will send a magic link to the address below.
      </Typography>
      <Form
        onSubmit={handleSubmit}
        sx={{ mt: 1 }}
        {...formProps}
      >
        <Grid container maxWidth={450} minWidth={280} spacing={2}>
          <Grid item width="100%" xs={12}>
            <TextField
              autoComplete="email"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              required
              type="email"
            />
          </Grid>
        </Grid>
        <Button
          fullWidth
          sx={{ mt: 3, mb: 2 }}
          type="submit"
          variant="contained"
        >
          Send Email
        </Button>
        <Grid container>
          <Grid item xs>
            <Link href={signInUrl} variant="body2">
              Remember your password? Sign in
            </Link>
          </Grid>
        </Grid>
      </Form>
    </Box>
  );
}
