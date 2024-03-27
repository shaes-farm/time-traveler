'use client';

import debugLogger from 'debug';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import type { User } from '@supabase/supabase-js';
import XIcon from '@mui/icons-material/X';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import PinterestIcon from '@mui/icons-material/Pinterest';
import PublicIcon from '@mui/icons-material/Public';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Unstable_Grid2 as Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  SnackBarAlert,
  SocialIconButton,
} from 'ui';
import type {
  Profile,
} from 'service';
import { AvatarUpload } from '../../../components/avatar-upload';
import {
  ContentEditor,
  Editor,
} from '../../../components';
import { update, updateEmail, type ActionResult } from './actions';
import { PasswordDialog } from './password-dialog';

const debug = debugLogger('admin:profile-edit-view');

const validationSchema = yup.object({
  firstName: yup
    .string()
    .min(3, 'First name should be a minimum of 3 characters long')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(3, 'Last name should be a minimum of 3 characters long')
    .required('Last name is required'),
  userName: yup
    .string()
    .min(3, 'User name should be a  minimum of 3 characters long'),
  avatarUrl: yup
    .string(),
  bio: yup
    .string(),
  email: yup
    .string()
    .email('Must be a valid email address.')
    .required('Email is required.'),
  website: yup
    .string()
    .url('Must be a valid URL.'),
  socialX: yup
    .string(),
  socialFacebook: yup
    .string(),
  socialInstagram: yup
    .string(),
  socialPinterest: yup
    .string(),
  socialYouTube: yup
    .string(),
});

interface ProfileEditViewProps {
  profile: Profile;
  user: User;
}

export default function ProfileEditView({ profile, user }: ProfileEditViewProps): JSX.Element {
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<ActionResult>({ message: '', success: true });
  const clearActionResult = (): void => { setActionResult({ message: '', success: true }) };

  debug('form', { profile });

  const formik = useFormik({
    initialValues: {
      id: profile.id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      userName: profile.userName ?? '',
      avatarUrl: profile.avatarUrl ?? `${profile.id}.jpg`,
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      socialX: profile.socialX ?? '',
      socialFacebook: profile.socialFacebook ?? '',
      socialInstagram: profile.socialInstagram ?? '',
      socialPinterest: profile.socialPinterest ?? '',
      socialYouTube: profile.socialYouTube ?? '',
    },
    validationSchema,
    onSubmit: async (values) => {
      debug('onSubmit', { values });
      let updateEmailResult: ActionResult | undefined;

      if (values.email && values.email !== user.email) {
        updateEmailResult = await updateEmail(values.email);
        if (!updateEmailResult.success) {
          setActionResult(updateEmailResult);
        }
      }

      if (!updateEmailResult || updateEmailResult.success) {
        const result = await update(values);
        setActionResult(result);
      }
    },
  });

  debug('form', { initialValues: formik.initialValues });

  return (
    <>
      <ContentEditor title="User Profile">
        <Editor onSubmit={formik.handleSubmit} title="Edit Profile">
          <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
            <Grid md={4} sm={12}>
              <Card sx={{ backgroundColor: 'black' }} variant="outlined">
                <CardContent>
                  <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
                    <Grid sx={{ mt: '1rem', textAlign: 'center' }} xs={12}>
                      <Typography variant="h3">
                        {formik.values.firstName}&nbsp;{formik.values.lastName}
                      </Typography>
                      <Typography variant="subtitle1">
                        {formik.values.userName ? `@${formik.values.userName}` : '(username not set)'}
                      </Typography>
                    </Grid>
                    <Grid display="flex" xs={12}>
                      <AvatarUpload
                        id={profile.id}
                        onError={(message: string) => { setActionResult({ message, success: false }) }}
                        onUpload={(url: string) => { void formik.setFieldValue('avatarUrl', url) }}
                        size={128}
                        url={formik.values.avatarUrl}
                      />
                    </Grid>
                    <Grid sx={{ textAlign: 'center' }} xs={12}>
                      <Typography variant="body2">
                        {formik.values.bio}
                      </Typography>
                    </Grid>
                    <Grid sx={{ mt: '1rem', textAlign: 'center' }} xs={12}>
                      {formik.values.website ? <SocialIconButton
                        resource={formik.values.website}
                        type="website"
                      /> : null}
                      {formik.values.socialX ? <SocialIconButton
                        resource={formik.values.socialX}
                        type="x"
                      /> : null}
                      {formik.values.socialFacebook ? <SocialIconButton
                        resource={formik.values.socialFacebook}
                        type="facebook"
                      /> : null}
                      {formik.values.socialInstagram ? <SocialIconButton
                        resource={formik.values.socialInstagram}
                        type="instagram"
                      /> : null}
                      {formik.values.socialPinterest ? <SocialIconButton
                        resource={formik.values.socialPinterest}
                        type="pinterest"
                      /> : null}
                      {formik.values.socialYouTube ? <SocialIconButton
                        resource={formik.values.socialYouTube}
                        type="youtube"
                      /> : null}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid md={8} sm={12}>
              <Paper elevation={1}>
                <Grid container spacing={2} sx={{ p: '1rem' }}>
                  <Grid xs={12}>
                    <Typography sx={{ mt: 1, mb: 1 }} variant="h4">
                      Personal Information
                    </Typography>
                  </Grid>
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
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AlternateEmailIcon />
                          </InputAdornment>
                        ),
                      }}
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
                      id="bio"
                      label="Bio"
                      multiline
                      name="bio"
                      onChange={formik.handleChange}
                      placeholder="Tell us a little about yourself!"
                      rows={3}
                      value={formik.values.bio}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography sx={{ mt: 1, mb: 1 }} variant="h4">
                      Account Credentials
                    </Typography>
                  </Grid>
                  <Grid display="flex" sm={7} xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
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
                  <Grid alignItems="right" display="flex" justifyContent="right" sm={5} xs={12}>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Box alignSelf='center'>
                      <Button
                        fullWidth
                        onClick={() => { setChangePassword(true) }}
                        size="large"
                        startIcon={<LockIcon />}
                        sx={{ px: 4 }}
                        type="button"
                        variant='outlined'
                      >
                        Change Password
                      </Button>
                    </Box>
                  </Grid>
                  <Grid xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography sx={{ mt: 1, mb: 1 }} variant="h4">
                      Social Presence
                    </Typography>
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PublicIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="website"
                      label="Website URL"
                      name="website"
                      onChange={formik.handleChange}
                      type="url"
                      value={formik.values.website}
                    />
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <XIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="socialX"
                      label="X (formerly Twitter)"
                      name="socialX"
                      onChange={formik.handleChange}
                      value={formik.values.socialX}
                    />
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FacebookIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="socialFacebook"
                      label="Facebook"
                      name="socialFacebook"
                      onChange={formik.handleChange}
                      value={formik.values.socialFacebook}
                    />
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InstagramIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="socialInstagram"
                      label="Instagram"
                      name="socialInstagram"
                      onChange={formik.handleChange}
                      value={formik.values.socialInstagram}
                    />
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PinterestIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="socialPinterest"
                      label="Pinterest"
                      name="socialPinterest"
                      onChange={formik.handleChange}
                      value={formik.values.socialPinterest}
                    />
                  </Grid>
                  <Grid display="flex" xs={12}>
                    <TextField
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <YouTubeIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      id="socialYouTube"
                      label="YouTube"
                      name="socialYouTube"
                      onChange={formik.handleChange}
                      value={formik.values.socialYouTube}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
          <SnackBarAlert clear={() => { clearActionResult() }} message={actionResult.message} severity={actionResult.success ? 'success' : 'error'} />
        </Editor>
      </ContentEditor>
      <PasswordDialog open={changePassword} setOpen={setChangePassword} setResult={setActionResult} />
    </>
  );
}
