'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Select,
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

const validationSchema = yup.object({
  email: yup
    .string(/* 'Enter your email' */)
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string(/* 'Enter your password' */)
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
});

const { log } = console;

interface PeriodFormProps {
  mode: 'create' | 'edit';
  period?: Period;
  timelines?: Timeline[];
  onDelete?: (period?: Period) => void;
  onCreate?: (period: Period) => void;
  onUpdate?: (period: Period) => void;
}

export function PeriodForm({ mode, period, timelines, onCreate, onDelete }: PeriodFormProps): JSX.Element {
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      title: '',
      slug: '',
      summary: '',
      beginDate: '',
      endDate: '',
      timelines: [],
    },
    validationSchema,
    onSubmit: (values) => {
      // const {title, slug, summary, beginDate, endDate, timelines} = values;
      log(JSON.stringify(values, null, 2));
      onCreate?.(values);
    },
  });

  const handleChangeMultiple = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { options } = event.target;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    log(value);
  };

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
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
            id="beginDate"
            label="Begin Date"
            name="beginDate"
            onChange={formik.handleChange}
            value={formik.values.beginDate}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="endDate"
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
        <Grid item md={6} xs={12}>
          <FormControl sx={{ m: 1, minWidth: 120, maxWidth: 300 }}>
            <InputLabel htmlFor="select-multiple-added" shrink>
              Added ({timelines?.length ?? 0})
            </InputLabel>
            <Select
              inputProps={{
                id: 'select-multiple-added',
              }}
              label={`Added (${timelines?.length ?? 0})`}
              multiple
              native
              // @ts-expect-error Typings are not considering `native`
              onChange={handleChangeMultiple}
              value={formik.values.timelines}
            >
              {period?.timelines.map((timeline) => (
                <option key={timeline.slug} value={timeline.title}>
                  {timeline.title}
                </option>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item md={1} xs={12}>
          <Button variant="outlined">&lt;</Button>
          &nbsp;
          <Button variant="outlined">&gt;</Button>
        </Grid>
        <Grid item md={5} xs={12}>
          <FormControl sx={{ m: 1, minWidth: 120, maxWidth: 300 }}>
            <InputLabel htmlFor="select-multiple-available" shrink>
              Available ({timelines?.length ?? 0})
            </InputLabel>
            <Select
              inputProps={{
                id: 'select-multiple-available',
              }}
              label={`Available (${timelines?.length ?? 0})`}
              multiple
              native
              // @ts-expect-error Typings are not considering `native`
              onChange={handleChangeMultiple}
            >
              {timelines?.map((timeline) => (
                <option key={timeline.slug} value={timeline.title}>
                  {timeline.title}
                </option>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          {(mode !== 'create' && period) ? <Button color='error' onClick={() => onDelete?.(period)} variant='outlined'>
            Delete
          </Button> : null}
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={() => {router.back()}} sx={{ ml: 2 }} variant='outlined'>
            Cancel
          </Button>
          <Button sx={{ ml: 2 }} type="submit" variant='contained'>
            Save
          </Button>
        </Grid>
      </Grid>
    </Form>
  );
}
