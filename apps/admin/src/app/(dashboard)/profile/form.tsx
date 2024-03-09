'use client';

import debugFactory from 'debug';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useFormik } from 'formik';
import * as yup from 'yup';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Unstable_Grid2 as Grid,
  Input,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Form,
  SnackBarAlert,
} from 'ui';
import type {
  Profile,
} from 'service';
import { AvatarUpload } from '../../../components/avatar-upload';

const debug = debugFactory('admin:profile-form');

const validationSchema = yup.object({
  firstName: yup
    .string()
    .min(3, 'First name should be a minimum of 3 characters long')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(3, 'Last name should be a minimum of 3 characters long')
    .required('Last name is required'),
  bio: yup
    .string(),
  website: yup
    .string()
    .url()
    .nullable(),
  avatarUrl: yup
    .string()
    .url()
    .nullable(),
  email: yup
    .string()
    .email()
    .required(),
  confirmEmail: yup
    .string()
    .email()
    .required(),
  password: yup
    .string()
    .required(),
  confirmPassword: yup
    .string()
    .required(),
});

interface ProfileFormProps {
  profile: Profile;
  user: User;
  update: (profile: Profile) => Promise<void>;
}

export default function ProfileForm({ user, profile, update }: ProfileFormProps): JSX.Element {
  const [errorMsg, setErrorMsg] = useState<string>('');
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      id: profile.id,
      confirmEmail: '',
      confirmPassword: '',
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl ?? '',
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      password: '',
      userName: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      debug('onSubmit', { values });
      await update(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" justifyContent="right" xs={12}>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={() => { router.back() }} sx={{ ml: 2 }} variant='outlined'>
            Cancel
          </Button>
          <Button startIcon={<SaveIcon />} sx={{ ml: 2 }} type="submit" variant='contained'>
            Save
          </Button>
        </Grid>
        <Grid md={8} sm={12}>
          <Paper elevation={1}>
            <Grid container spacing={2} sx={{ p: '1rem' }}>
              <Grid display="flex" sm={6} xs={12}>
                <TextField
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  onChange={formik.handleChange}
                  required
                  value={formik.values.firstName}
                />
              </Grid>
              <Grid display="flex" sm={6} xs={12}>
                <TextField
                  fullWidth
                  hidden
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  onChange={formik.handleChange}
                  required
                  value={formik.values.lastName}
                />
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ mt: 2 }} />
                <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
                  Personal Information
                </Typography>
              </Grid>
              <Grid display="flex" xs={12}>
                <Input
                  id="id"
                  name="id"
                  type="hidden"
                  value={formik.values.id}
                />
                <TextField
                  fullWidth
                  id="userName"
                  label="User Name"
                  name="userName"
                  onChange={formik.handleChange}
                  value={formik.values.userName}
                />
              </Grid>
              <Grid display="flex" xs={12}>
                <TextField
                  fullWidth
                  id="website"
                  label="Website URL"
                  name="website"
                  onChange={formik.handleChange}
                  type="url"
                  value={formik.values.website}
                />
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ mt: 2 }} />
                <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
                  Social Profile
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Box>| xxx Future home of social media icon buttons xxxx |</Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid display="flex" md={4} sm={12}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
                <Grid sx={{ mt: '1rem', textAlign: 'center' }} xs={12}>
                  <Typography variant="h6">
                    {formik.values.firstName}&nbsp;{formik.values.lastName}
                  </Typography>
                  <Typography variant="body2">
                    {formik.values.userName ? `@${formik.values.userName}` : '(username not set)'}
                  </Typography>
                </Grid>
                <Grid display="flex" xs={12}>
                  <AvatarUpload
                    id={profile.id}
                    onError={(msg: string) => { setErrorMsg(msg) }}
                    onUpload={(url: string) => { void formik.setFieldValue('avatarUrl', url) }}
                    size={128}
                    url={formik.values.avatarUrl}
                  />
                </Grid>
                <Grid sx={{ mt: '1rem', textAlign: 'center' }} xs={12}>
                  <Typography variant="body2">
                    {formik.values.email}
                  </Typography>
                  <Typography variant="body2">
                    {formik.values.website ? formik.values.website : '(website not set)'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ textAlign: 'center' }}>
              <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
                <Grid sx={{ mb: '1rem' }} xs={12}>
                  <Button onClick={() => { console.log('update email and password') }} sx={{ ml: 2 }} type="button" variant='outlined'>
                    Update Email & Password
                  </Button>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      <SnackBarAlert clear={() => { setErrorMsg('') }} message={errorMsg} severity="error" />
    </Form >
  );
}

/* <Grid xs={12}>
<Divider sx={{ mt: 2 }} />
<Typography sx={{ mt: 1, mb: 1 }} variant="h6">
  Account Credentials
</Typography>
</Grid>
<Grid display="flex" md={6} xs={12}>
<TextField
  fullWidth
  id="email"
  label="Email"
  name="email"
  onChange={formik.handleChange}
  required
  type="email"
  value={formik.values.email}
/>
</Grid>
<Grid display="flex" md={6} xs={12}>
<TextField
  fullWidth
  id="confirmEmail"
  label="Confirm Email"
  name="confirmEmail"
  onChange={formik.handleChange}
  type="email"
  value={formik.values.confirmEmail}
/>
</Grid>
<Grid display="flex" md={6} xs={12}>
<TextField
  fullWidth
  id="password"
  label="Password"
  name="password"
  onChange={formik.handleChange}
  required
  type="password"
  value={formik.values.password}
/>
</Grid>
<Grid display="flex" md={6} xs={12}>
<TextField
  fullWidth
  id="confirmPassword"
  label="Confirm Password"
  name="confirmPassword"
  onChange={formik.handleChange}
  type="password"
  value={formik.values.confirmPassword}
/>
</Grid> */
