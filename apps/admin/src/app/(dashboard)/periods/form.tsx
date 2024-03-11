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
  Period,
  Timeline,
} from 'service';
import { TransferList } from '../../../components/transfer-list';

const debug = debugLogger('admin:period-form');

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
  beginDate: yup
    .string()
    .required('Begin date is required.'),
  endDate: yup
    .string()
    .required('End date is required'),
  timelines: yup
    .array(),
});

interface PeriodFormProps {
  mode: 'create' | 'edit';
  period?: Period;
  timelines?: readonly Timeline[];
  create: (period: Period) => Promise<void>;
  update: (period: Period) => Promise<void>;
}

export default function PeriodForm({ mode, period, timelines, create, update }: PeriodFormProps): JSX.Element {
  const router = useRouter();

  const initialValues: Period = (mode === 'edit' && period) ? {
    userId: period.userId ?? '',
    title: period.title,
    slug: period.slug,
    summary: period.summary ?? '',
    beginDate: period.beginDate,
    endDate: period.endDate,
    timelines: period.timelines,
  } : {
    userId: '',
    title: '',
    slug: '',
    summary: '',
    beginDate: '',
    endDate: '',
    timelines: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('period-form.onSubmit', {mode, values});
      mode === 'create' ? await create(values) : await update(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          <Grid display="flex" item xs={12}>
            <Typography color="text.secondary" sx={{ mb: '1em' }} variant="caption">
              URL: {`/periods/${formik.values.slug}`}
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
            rows={9}
            value={formik.values.summary}
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
            Timelines
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TransferList
            available={timelines ?? []}
            items={formik.values.timelines}
            onChange={(_t) => { /* debug({ t }) */ }}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
