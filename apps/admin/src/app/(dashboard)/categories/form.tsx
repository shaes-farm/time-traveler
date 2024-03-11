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
  Category,
  HistoricalEvent,
} from 'service';
import { TransferList } from '../../../components/transfer-list';

const debug = debugLogger('admin:category-form');

const validationSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Title should be a minimum of 3 characters long')
    .required('Title is required'),
  slug: yup
    .string()
    .required('Slug is required'),
  events: yup
    .array(),
});

interface CategoryFormProps {
  mode: 'create' | 'edit';
  category?: Category;
  events?: readonly HistoricalEvent[];
  create: (category: Category) => Promise<void>;
  update: (category: Category) => Promise<void>;
}

export default function CategoryForm({ mode, category, events, create, update }: CategoryFormProps): JSX.Element {
  const router = useRouter();

  const initialValues: Category = (mode === 'edit' && category) ? {
    userId: category.userId ?? '',
    title: category.title,
    slug: category.slug,
    events: category.events,
  } : {
    userId: '',
    title: '',
    slug: '',
    events: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('category-form.onSubmit', {mode, values});
      mode === 'create' ? await create(values) : await update(values);
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2} sx={{ width: "100%", mx: "auto" }}>
        <Grid alignItems="right" display="flex" item justifyContent="right" xs={12}>
          <Grid display="flex" item xs={12}>
            <Typography color="text.secondary" sx={{ mb: '1em' }} variant="caption">
              URL: {`/categories/${formik.values.slug}`}
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
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 1, mb: 1 }} variant="h6">
            HistoricalEvents
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TransferList
            available={events ?? []}
            items={formik.values.events}
            onChange={(_t) => { /* debug({ t }) */ }}
          />
        </Grid>
      </Grid>
    </Form>
  );
}
