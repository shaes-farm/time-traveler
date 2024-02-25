'use client';

import debugFactory from 'debug';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import {
  Form,
} from 'ui';
import type {
  Story,
  Period,
} from 'service';
import { TransferList } from '../../../components/transfer-list';
import { insert, update } from './actions';

const debug = debugFactory('admin:story-form');

const validationSchema = yup.object({
  slug: yup
    .string()
    .required('Slug is required'),
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  subTitle: yup
    .string()
    .min(3, 'Sub-title should be a minimum of 3 characters long'),
  summary: yup
    .string(),
  detail: yup
    .string(),
  periods: yup
    .array(),
});

interface StoryFormProps {
  mode: 'create' | 'edit';
  story?: Story;
  periods?: readonly Period[];
}

export default function StoryForm({ mode, story, periods }: StoryFormProps): JSX.Element {
  const router = useRouter();

  const initialValues: Story = (mode === 'edit' && story) ? {
    userId: story.userId ?? '',
    slug: story.slug,
    title: story.title,
    subTitle: story.subTitle,
    summary: story.summary ?? '',
    detail: story.detail ?? '',
    periods: story.periods,
  } : {
    userId: '',
    slug: '',
    title: '',
    subTitle: '',
    summary: '',
    detail: '',
    periods: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('story-form.onSubmit', { mode, values });
      mode === 'create' ? await insert(values) : await update(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          <Grid display="flex" item xs={12}>
            <Typography color="text.secondary" sx={{ mb: '1em' }} variant="caption">
              URL: {`/stories/${formik.values.slug}`}
            </Typography>
          </Grid>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={() => { router.back() }} sx={{ ml: 2 }} variant='outlined'>
            Cancel
          </Button>
          <Button startIcon={<SaveIcon />} sx={{ ml: 2 }} type="submit" variant='contained'>
            Save
          </Button>
        </Grid>
        <Grid display="flex" item xs={12}>
          <TextField
            fullWidth
            hidden
            id="slug"
            label="Slug"
            name="slug"
            onChange={formik.handleChange}
            required
            value={formik.values.slug}
          />
        </Grid>
        <Grid display="flex" item xs={12}>
          <TextField
            fullWidth
            id="title"
            label="Title"
            name="title"
            onChange={formik.handleChange}
            required
            value={formik.values.title}
          />
        </Grid>
        <Grid display="flex" item xs={12}>
          <TextField
            fullWidth
            id="subTitle"
            label="Sub-title"
            name="subTitle"
            onChange={formik.handleChange}
            value={formik.values.subTitle}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="summary"
            label="Summary"
            multiline
            name="summary"
            onChange={formik.handleChange}
            rows={4}
            value={formik.values.summary}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="detail"
            label="Detail"
            multiline
            name="detail"
            onChange={formik.handleChange}
            rows={13}
            value={formik.values.detail}
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
            Periods
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TransferList
            available={periods ?? []}
            items={formik.values.periods}
            onChange={(_t) => { /* debug({ t }) */ }}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
