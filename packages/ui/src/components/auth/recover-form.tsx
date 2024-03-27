'use client';
import {type ReactNode, useState} from 'react';
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
import { Form } from '../form';
import { SnackBarAlert } from '../snack-bar-alert';

interface RecoverPasswordFormProps {
  icon?: ReactNode;
  title?: ReactNode;
  subTitle?: ReactNode;
  recoverPassword: (formData: FormData) => Promise<void>
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
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (data: FormData): void => {
    recoverPassword(data).catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- allow error message
      setErrorMsg(error.message as string);
    });
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
          formAction={handleSubmit}
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
      <SnackBarAlert clear={() => { setErrorMsg('') }} message={errorMsg} severity="error" />
    </Box>
  );
}
