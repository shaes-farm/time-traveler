'use client';

import debugLogger from 'debug';
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
  HistoricalEvent,
  Media,
} from 'service';
import { TransferList } from '../../../components/transfer-list';

const debug = debugLogger('admin:event-form');

const validationSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  slug: yup
    .string()
    .required('Slug is required'),
  summary: yup
    .string(),
  detail: yup
    .string(),
  location: yup
    .string(),
  importance: yup
    .number()
    .required('Importance is required to be between 0 and 9'),
  beginDate: yup
    .string()
    .required('Begin date is required.'),
  endDate: yup
    .string()
    .required('End date is required'),
  media: yup
    .array(),
  categories: yup
    .array(),
  timelines: yup
    .array(),
});

interface HistoricalEventFormProps {
  mode: 'create' | 'edit';
  event?: HistoricalEvent;
  media?: readonly Media[];
  create: (event: HistoricalEvent) => Promise<void>;
  update: (event: HistoricalEvent) => Promise<void>;
}

export default function HistoricalEventForm({ mode, event, media, create, update }: HistoricalEventFormProps): JSX.Element {
  const router = useRouter();

  const initialValues: HistoricalEvent = (mode === 'edit' && event) ? {
    userId: event.userId ?? '',
    title: event.title,
    slug: event.slug,
    summary: event.summary ?? '',
    detail: event.detail ?? '',
    location: event.location,
    importance: event.importance,
    beginDate: event.beginDate,
    endDate: event.endDate,
    media: event.media,
    categories: event.categories,
    timelines: event.timelines,
  } : {
    userId: '',
    title: '',
    slug: '',
    summary: '',
    detail: '',
    location: '',
    importance: 1,
    beginDate: '',
    endDate: '',
    media: [],
    categories: [],
    timelines: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('event-form.onSubmit', { mode, values });
      mode === 'create' ? await create(values) : await update(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          <Grid display="flex" item xs={12}>
            <Typography color="text.secondary" sx={{ mb: '1em' }} variant="caption">
              URL: {`/events/${formik.values.slug}`}
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
            hidden
            id="slug"
            label="Slug"
            name="slug"
            onChange={formik.handleChange}
            required
            value={formik.values.slug}
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
        <Grid display="flex" item xs={12}>
          <TextField
            fullWidth
            hidden
            id="location"
            label="Location"
            name="location"
            onChange={formik.handleChange}
            required
            value={formik.values.location}
          />
        </Grid>
        <Grid display="flex" item xs={12}>
          <TextField
            fullWidth
            hidden
            id="importance"
            label="Importance"
            name="importance"
            onChange={formik.handleChange}
            required
            value={formik.values.importance}
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
            Date Range
          </Typography>
        </Grid>
        <Grid item sm={6} xs={12}>
          <TextField
            fullWidth
            id="begin-date"
            label="Begin Date"
            name="beginDate"
            onChange={formik.handleChange}
            value={formik.values.beginDate}
          />
        </Grid>
        <Grid item sm={6} xs={12}>
          <TextField
            fullWidth
            id="end-date"
            label="End Date"
            name="endDate"
            onChange={formik.handleChange}
            value={formik.values.endDate}
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
            Medias
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TransferList
            available={media?.map((m, index) => {
              return {
                title: m.alternativeText ?? `Media #${index}`,
                ...m,
              };
            }) ?? []}
            items={formik.values.media.map((m, index) => {
              return {
                title: m.alternativeText ?? `Media #${index}`,
                ...m,
              };
            })}
            onChange={(_t) => { /* debug({ t }) */ }}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
