'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
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
import {TransferList} from './transfer-list';

const { log } = console;

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
});

interface PeriodFormProps {
  mode: 'create' | 'edit';
  period?: Period;
  timelines?: readonly Timeline[];
  onCreate?: (period: Period) => void;
  onUpdate?: (period: Period) => void;
}

export function PeriodForm({ mode, period, timelines, onCreate, onUpdate }: PeriodFormProps): JSX.Element {
  const router = useRouter();

  const initialValues: Period = (mode === 'edit' && period) ? period : {
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
    onSubmit: (values) => {
      mode === 'create' ? onCreate?.(values) : onUpdate?.(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          <Grid display="flex" item xs={12}>
            <Typography color="text.secondary" sx={{mb: '1em'}} variant="caption">
                URL slug: {formik.values.slug}
            </Typography>
          </Grid>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={() => {router.back()}} sx={{ ml: 2 }} variant='outlined'>
            Cancel
          </Button>
          <Button sx={{ ml: 2 }} type="submit" variant='contained'>
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
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="begin-date"
            label="Begin Date"
            name="beginDate"
            onChange={formik.handleChange}
            value={formik.values.beginDate}
          />
        </Grid>
        <Grid item xs={12}>
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
            onChange={(t) => {log({t})}}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
