'use client';
import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Grid,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { Form } from '../form';
import { SnackBarAlert } from '../snack-bar-alert';

export interface SignUpFormProps {
  icon?: React.ReactNode;
  title?: React.ReactNode | string;
  subTitle?: React.ReactNode | string;
  signUp: (formData: FormData) => Promise<void>;
  signInUrl: string;
  formProps?: object[];
}

export function SignUpForm({
  icon,
  title,
  subTitle,
  signUp,
  signInUrl,
  ...formProps
}: SignUpFormProps): JSX.Element {
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (data: FormData): void => {
    signUp(data).catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- allow error message
      setErrorMsg(error.message as string);
    });
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
        {icon ?? <PersonOutlineOutlinedIcon />}
      </Avatar>
      {title ? <Typography align="center" color="primary" component="h2" gutterBottom variant="h4">{title}</Typography> : null}
      {subTitle ? <Typography align="center" color="primary" component="h3" gutterBottom variant="h5">{subTitle}</Typography> : null}
      <Typography variant="body2">
        Sign up to create an account!
      </Typography>
      <Form
        autoComplete="on"
        sx={{ mt: 3 }}
        {...formProps}
      >
        <Grid container maxWidth={450} minWidth={350} spacing={2}>
          <Grid item sm={6} xs={12}>
            <TextField
              autoComplete="given-name"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- allow auto focus
              autoFocus
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              required
            />
          </Grid>
          <Grid item sm={6} xs={12}>
            <TextField
              autoComplete="family-name"
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              required
            />
          </Grid>
          <Grid item xs={12}>
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="password"
              label="Password"
              name="password"
              required
              type="password"
            />
          </Grid>
        </Grid>
        <Button
          formAction={handleSubmit}
          fullWidth
          sx={{ mt: 3, mb: 2 }}
          type="submit"
          variant="contained"
        >
          Sign Up
        </Button>
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Link href={signInUrl} variant="body2">
              Already have an account? Sign in
            </Link>
          </Grid>
        </Grid>
      </Form>
      <SnackBarAlert clear={() => { setErrorMsg('') }} message={errorMsg} severity="error" />
    </Box>
  );
};

export default SignUpForm;
