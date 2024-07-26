'use client';

import debugLogger from 'debug';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import slugify from 'slugify';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
  Box,
  Unstable_Grid2 as Grid,
  Tab,
  TextField,
} from '@mui/material';
import type {
  Category,
  HistoricalEvent,
  Media,
  Timeline,
} from 'service';
import {
  DateRangePicker,
  ImportanceMeter,
  ItemList,
  Permalink,
  RichTextEditor,
} from 'ui';
import {
  ContentEditor,
  Editor,
} from '../../../components';
import { insert, update } from './actions';

const debug = debugLogger('admin:events:edit-view');

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

interface HistoricalEventEditViewProps {
  mode: 'create' | 'edit';
  event?: HistoricalEvent;
  categories?: readonly Category[];
  media?: readonly Media[];
  timelines?: readonly Timeline[];
}

export default function HistoricalEventEditView({ mode, event, categories }: HistoricalEventEditViewProps): JSX.Element {
  const [tabIndex, setTabIndex] = useState<string>('1');

  const initialValues: HistoricalEvent = (mode === 'edit' && event) ? {
    userId: event.userId ?? '',
    slug: event.slug,
    title: event.title,
    summary: event.summary ?? '',
    detail: event.detail ?? '',
    location: event.location ?? '',
    importance: event.importance,
    beginDate: event.beginDate,
    endDate: event.endDate ?? '',
    published: event.published,
    publishedAt: event.publishedAt ?? '',
    categories: event.categories,
    timelines: event.timelines,
    media: event.media,
  } : {
    userId: '',
    slug: '',
    title: '',
    summary: '',
    detail: '',
    location: '',
    importance: 5,
    beginDate: '',
    endDate: '',
    published: false,
    publishedAt: '',
    categories: [],
    timelines: [],
    media: [],
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string): void => {
    setTabIndex(newValue);
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
    <ContentEditor title="Historical Events">
      <Editor onSubmit={formik.handleSubmit} title={`${mode === 'create' ? 'Create' : 'Edit'} Event`}>
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
            <Grid border={1} borderColor="divider" borderRadius={1}>
              <TabContext value={tabIndex}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList aria-label="event detail editor tabs" onChange={handleTabChange}>
                    <Tab label="Edit" value="1" />
                    <Tab label="Raw" value="2" />
                  </TabList>
                </Box>
                <TabPanel value="1">
                  <RichTextEditor
                    content={formik.values.detail}
                    onUpdate={(doc: object) => { void formik.setFieldValue('detail', doc) }}
                  />
                </TabPanel>
                <TabPanel value="2">
                  <TextField
                    fullWidth
                    label="Detail"
                    multiline
                    name="detail"
                    onChange={formik.handleChange}
                    rows={25}
                    value={formik.values.detail}
                  />
                </TabPanel>
              </TabContext>
            </Grid>
          </Grid>
          <Grid md={4} sm={12}>
            <Grid mb={2} sm={12}>
              <Permalink url={formik.values.slug.trim().length ? `/events/${formik.values.slug}` : ''} />
            </Grid>
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="slug"
                label="Slug"
                name="slug"
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
            <Grid mb={2} sm={12}>
              <TextField
                fullWidth
                id="location"
                label="Location"
                name="location"
                onChange={formik.handleChange}
                value={formik.values.location}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <ImportanceMeter
                importance={formik.values.importance}
                onChange={(importance) => {void formik.setFieldValue('importance', importance)}}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <DateRangePicker
                beginDate={formik.values.beginDate}
                endDate={formik.values.endDate ?? ''}
                onChangeBeginDate={(beginDate): void => {
                  void formik.setFieldValue('beginDate', beginDate);
                }}
                onChangeEndDate={(endDate): void => {
                  void formik.setFieldValue('endDate', endDate);
                }}
              />
            </Grid>
            <Grid mb={2} sm={12}>
              <ItemList
                available={categories ?? []}
                itemNames={{ singular: 'category', plural: 'categories' }}
                items={formik.values.categories}
                onChange={(items) => {
                  void formik.setFieldValue('categories', items)
                }}
                title="Categories"
                value=""
              />
            </Grid>
          </Grid>
        </Grid>
      </Editor>
    </ContentEditor >
  );
}
