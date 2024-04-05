'use client';

import debugLogger from 'debug';
import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import slugify from 'slugify';
import {
  Unstable_Grid2 as Grid,
  TextField,
} from '@mui/material';
import type {
  Category,
  HistoricalEvent,
} from 'service';
import {
  ItemList,
} from 'ui';
import {
  ContentEditor,
  Editor,
  Permalink,
} from '../../../components';
import { insert, update } from './actions';

const debug = debugLogger('admin:categories:edit-view');

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

interface CategoryEditViewProps {
  mode: 'create' | 'edit';
  category?: Category;
  events?: readonly HistoricalEvent[];
}

export default function CategoryEditView({ mode, category, events }: CategoryEditViewProps): JSX.Element {
  const initialValues: Category = (mode === 'edit' && category) ? {
    userId: category.userId ?? '',
    slug: category.slug,
    title: category.title,
    events: category.events,
  } : {
    userId: '',
    slug: '',
    title: '',
    events: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      debug('onSubmit', { mode, values });
      mode === 'create' ? await insert(values) : await update(values);
    },
  });

  return (
    <ContentEditor title="Categories">
      <Editor onSubmit={formik.handleSubmit} title={`${mode === 'create' ? 'Create' : 'Edit'} Category`}>
        <Grid container spacing={2}>
          <Grid md={8} sm={12}>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="title"
                label="Title"
                name="title"
                onBlur={(e: unknown) => {
                  if (formik.values.slug.trim().length === 0) {
                    void formik.setFieldValue('slug', slugify(formik.values.title, { lower: true }));
                  }
                  formik.handleBlur(e);
                }}
                onChange={formik.handleChange}
                required
                value={formik.values.title}
              />
            </Grid>
          </Grid>
          <Grid md={4} sm={12}>
            <Grid mb={2} sm={12}>
              <Permalink url={formik.values.slug.length ? `/categories/${formik.values.slug}` : ''} />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="slug"
                label="Slug"
                name="slug"
                onBlur={() => {
                  if (formik.values.slug.trim().length === 0) {
                    void formik.setFieldValue('slug', slugify(formik.values.title, { lower: true }));
                  }
                }}
                onChange={formik.handleChange}
                onFocus={() => {
                  if (formik.values.slug.trim().length === 0) {
                    void formik.setFieldValue('slug', slugify(formik.values.title, { lower: true }));
                  }
                }}
                required
                value={formik.values.slug}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <ItemList
                available={events ?? []}
                itemNames={{ singular: 'historical event', plural: 'historical events' }}
                items={formik.values.events}
                onChange={(items) => {
                  void formik.setFieldValue('events', items)
                }}
                title="Historical Events"
                value=""
              />
            </Grid>
          </Grid>
        </Grid>
      </Editor>
    </ContentEditor >
  );
}
